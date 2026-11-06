-- Private garden authorization and a non-sensitive, read-only availability check.
begin;

create table public.app_healthcheck (
  id integer primary key check (id = 1),
  status text not null check (status = 'ok')
);
insert into public.app_healthcheck (id, status) values (1, 'ok');
alter table public.app_healthcheck enable row level security;
revoke all on public.app_healthcheck from public, anon, authenticated;
grant select on public.app_healthcheck to anon, authenticated;
create policy app_healthcheck_read on public.app_healthcheck for select to anon, authenticated using (id = 1);

-- Supabase owns realtime.messages and has already enabled RLS. Do not ALTER it.
-- Operator prerequisite: disable Realtime's "Allow public access" setting.
create policy quiet_garden_guest_receive on realtime.messages
for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
  and (select realtime.topic()) = 'quiet-garden:v1'
  and extension in ('presence', 'broadcast')
);
create policy quiet_garden_guest_send on realtime.messages
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
  and (select realtime.topic()) = 'quiet-garden:v1'
  and extension in ('presence', 'broadcast')
);

comment on table public.app_healthcheck is 'One static public read; never visitor or religious activity.';
commit;
