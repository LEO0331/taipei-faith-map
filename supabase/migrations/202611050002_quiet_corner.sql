-- Notes are never publicly readable until an operator approves them.
begin;

create table public.quiet_corner_settings (
  id integer primary key check (id = 1),
  posting_enabled boolean not null default false
);
insert into public.quiet_corner_settings(id, posting_enabled) values (1, false);

create table public.quiet_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 1024 and octet_length(content) <= 1024),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  author_key text not null check (author_key ~ '^[a-f0-9]{64}$'),
  check (expires_at <= created_at + interval '30 days')
);
create unique index quiet_notes_actor_content_unique on public.quiet_notes(author_key, content);
create index quiet_notes_public_selection on public.quiet_notes(created_at desc) where status = 'approved';

create table public.quiet_note_reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.quiet_notes(id) on delete cascade,
  reporter_key text not null check (reporter_key ~ '^[a-f0-9]{64}$'),
  reason text not null check (reason in ('unsafe', 'personal-data', 'spam', 'other')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(note_id, reporter_key)
);
create table public.quiet_rate_limits (
  actor_key text not null check (actor_key ~ '^[a-f0-9]{64}$'),
  action text not null check (action in ('submit', 'report')),
  window_started_at timestamptz not null,
  last_attempt_at timestamptz not null,
  attempts integer not null,
  primary key(actor_key, action)
);

alter table public.quiet_notes enable row level security;
alter table public.quiet_note_reports enable row level security;
alter table public.quiet_rate_limits enable row level security;
alter table public.quiet_corner_settings enable row level security;
revoke all on public.quiet_notes, public.quiet_note_reports, public.quiet_rate_limits, public.quiet_corner_settings from public, anon, authenticated;
grant all on public.quiet_notes, public.quiet_note_reports, public.quiet_rate_limits, public.quiet_corner_settings to service_role;

-- No raw-table reader policy, including for an anonymous note's author.
-- SECURITY DEFINER exposes only this fixed approved/unexpired response shape.
create function public.get_approved_quiet_notes(p_limit integer default 15)
returns table(id uuid, content text, expires_at timestamptz)
language sql stable security definer set search_path = pg_catalog
as $$
  select n.id, n.content, n.expires_at
  from public.quiet_notes n
  where n.status = 'approved' and n.expires_at > now()
  order by n.created_at desc, n.id
  limit least(greatest(coalesce(p_limit, 15), 1), 15)
$$;
revoke all on function public.get_approved_quiet_notes(integer) from public;
grant execute on function public.get_approved_quiet_notes(integer) to anon, authenticated;

-- Called only inside service-only mutation RPCs; advisory lock serializes an actor.
create function public.quiet_claim_rate_limit(p_actor_key text, p_action text)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
declare current_row public.quiet_rate_limits%rowtype;
  allowed_count integer := case when p_action = 'submit' then 5 else 10 end;
  minimum_gap interval := case when p_action = 'submit' then interval '2 minutes' else interval '15 seconds' end;
begin
  if p_actor_key is null or p_action is null or p_actor_key !~ '^[a-f0-9]{64}$' or p_action not in ('submit', 'report') then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor_key || ':' || p_action, 0));
  select * into current_row from public.quiet_rate_limits where actor_key = p_actor_key and action = p_action;
  if found and current_row.window_started_at > now() - interval '1 hour' then
    if current_row.attempts >= allowed_count or current_row.last_attempt_at > now() - minimum_gap then return false; end if;
    update public.quiet_rate_limits set attempts = attempts + 1, last_attempt_at = now()
    where actor_key = p_actor_key and action = p_action;
  else
    insert into public.quiet_rate_limits(actor_key, action, window_started_at, last_attempt_at, attempts)
      values (p_actor_key, p_action, now(), now(), 1)
    on conflict (actor_key, action) do update set window_started_at = now(), last_attempt_at = now(), attempts = 1;
  end if;
  return true;
end;
$$;
revoke all on function public.quiet_claim_rate_limit(text, text) from public, anon, authenticated, service_role;

create function public.queue_quiet_note(p_actor_key text, p_content text)
returns text language plpgsql security definer set search_path = pg_catalog
as $$
declare posting_allowed boolean;
begin
  -- Grapheme limits are authoritative in the authenticated Edge Function as well.
  if p_actor_key is null or p_actor_key !~ '^[a-f0-9]{64}$' or p_content is null
    or char_length(btrim(p_content)) = 0 or char_length(p_content) > 1024 or octet_length(p_content) > 1024 then return 'invalid'; end if;
  select posting_enabled into posting_allowed from public.quiet_corner_settings where id = 1 for share;
  if not coalesce(posting_allowed, false) then return 'disabled'; end if;
  if not public.quiet_claim_rate_limit(p_actor_key, 'submit') then return 'rate-limited'; end if;
  if exists(select 1 from public.quiet_notes where author_key = p_actor_key and content = p_content) then return 'duplicate'; end if;
  insert into public.quiet_notes(content, author_key, status) values (p_content, p_actor_key, 'pending');
  return 'received';
end;
$$;
revoke all on function public.queue_quiet_note(text, text) from public, anon, authenticated;
grant execute on function public.queue_quiet_note(text, text) to service_role;

create function public.report_quiet_note(p_actor_key text, p_note_id uuid, p_reason text)
returns text language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if p_actor_key is null or p_actor_key !~ '^[a-f0-9]{64}$' or p_reason not in ('unsafe', 'personal-data', 'spam', 'other') or p_reason is null then return 'invalid'; end if;
  if not public.quiet_claim_rate_limit(p_actor_key, 'report') then return 'rate-limited'; end if;
  if not exists(select 1 from public.quiet_notes where id = p_note_id and status = 'approved' and expires_at > now()) then return 'unavailable'; end if;
  insert into public.quiet_note_reports(note_id, reporter_key, reason) values(p_note_id, p_actor_key, p_reason)
    on conflict (note_id, reporter_key) do nothing;
  -- A report never publishes, hides or changes another visitor's note automatically.
  return 'received';
end;
$$;
revoke all on function public.report_quiet_note(text, uuid, text) from public, anon, authenticated;
grant execute on function public.report_quiet_note(text, uuid, text) to service_role;

create function public.moderate_quiet_note(p_note_id uuid, p_action text)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if p_action = 'delete' then delete from public.quiet_notes where id = p_note_id; return found;
  elsif p_action = 'approve' then
    update public.quiet_notes set status = 'approved', reviewed_at = now() where id = p_note_id and expires_at > now(); return found;
  elsif p_action = 'hide' then
    update public.quiet_notes set status = 'hidden', reviewed_at = now() where id = p_note_id; return found;
  else raise exception 'Unsupported moderation action'; end if;
end;
$$;
revoke all on function public.moderate_quiet_note(uuid, text) from public, anon, authenticated;
grant execute on function public.moderate_quiet_note(uuid, text) to service_role;

create function public.maintain_quiet_corner()
returns void language plpgsql security definer set search_path = pg_catalog
as $$
begin
  delete from public.quiet_notes where expires_at <= now()
    or (status = 'pending' and created_at <= now() - interval '7 days')
    or (status = 'hidden' and reviewed_at <= now() - interval '7 days');
  delete from public.quiet_note_reports where created_at <= now() - interval '30 days';
  delete from public.quiet_rate_limits where last_attempt_at <= now() - interval '24 hours';
end;
$$;
revoke all on function public.maintain_quiet_corner() from public, anon, authenticated;
grant execute on function public.maintain_quiet_corner() to service_role;

comment on column public.quiet_notes.author_key is 'Server-side HMAC of internal Auth ID. Never returned publicly; deleted with note retention.';
commit;
