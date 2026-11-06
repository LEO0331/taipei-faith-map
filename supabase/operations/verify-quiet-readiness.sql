-- Operator-only, read-only audit after applying the two V1.5 migrations.
-- Run in the intended Supabase Dashboard SQL editor. This does not change flags,
-- publish notes, create users, apply migrations or schedule maintenance.
begin read only;

select name, passed
from (
  select 'health row and RLS' as name,
    (select count(*) = 1 and bool_and(id = 1 and status = 'ok') from public.app_healthcheck)
    and (select relrowsecurity from pg_class where oid = 'public.app_healthcheck'::regclass) as passed
  union all
  select 'raw Corner tables use RLS', bool_and(c.relrowsecurity)
    from pg_class c where c.oid in ('public.quiet_notes'::regclass, 'public.quiet_note_reports'::regclass, 'public.quiet_rate_limits'::regclass, 'public.quiet_corner_settings'::regclass)
  union all
  select 'public roles cannot access raw Corner data', bool_and(
    not has_table_privilege(r.name, t.name, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    and not has_any_column_privilege(r.name, t.name, 'SELECT,INSERT,UPDATE,REFERENCES'))
    from (values ('anon'), ('authenticated')) r(name)
    cross join (values ('public.quiet_notes'), ('public.quiet_note_reports'), ('public.quiet_rate_limits'), ('public.quiet_corner_settings')) t(name)
  union all
  select 'public roles can read approved projection', bool_and(has_function_privilege(r.name, 'public.get_approved_quiet_notes(integer)', 'EXECUTE'))
    from (values ('anon'), ('authenticated')) r(name)
  union all
  select 'public roles cannot mutate through privileged RPCs', bool_and(not has_function_privilege(r.name, f.name, 'EXECUTE'))
    from (values ('anon'), ('authenticated')) r(name)
    cross join (values ('public.queue_quiet_note(text,text)'), ('public.report_quiet_note(text,uuid,text)'), ('public.moderate_quiet_note(uuid,text)'), ('public.maintain_quiet_corner()'), ('public.quiet_claim_rate_limit(text,text)')) f(name)
  union all
  select 'service role has intended operator RPCs', bool_and(has_function_privilege('service_role', f.name, 'EXECUTE'))
    from (values ('public.queue_quiet_note(text,text)'), ('public.report_quiet_note(text,uuid,text)'), ('public.moderate_quiet_note(uuid,text)'), ('public.maintain_quiet_corner()')) f(name)
  union all
  select 'posting is paused for verification', not posting_enabled from public.quiet_corner_settings where id = 1
  union all
  select 'Realtime guest policies exist', count(*) = 2
    from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname in ('quiet_garden_guest_receive', 'quiet_garden_guest_send')
) checks
order by name;

-- Inspect EVERY applicable policy, not only this application's two named policies:
-- PostgreSQL permissive policies combine with OR, so another broad policy can
-- reopen access. Review expressions and controlled allow/deny tests together.
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'realtime' and tablename = 'messages'
order by policyname;

-- Counts only; private content and internal actor keys are intentionally omitted.
select status, count(*) as retained,
  count(*) filter (where expires_at <= now()) as expired,
  count(*) filter (where status = 'pending' and created_at <= now() - interval '7 days') as overdue_pending,
  count(*) filter (where status = 'hidden' and reviewed_at <= now() - interval '7 days') as overdue_hidden
from public.quiet_notes group by status order by status;
select count(*) as unreviewed_reports from public.quiet_note_reports where reviewed_at is null;
commit;
