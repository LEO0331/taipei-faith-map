-- DELIBERATE OPERATOR SETUP ONLY. Not a migration; never run in public clients.
-- Prerequisites: intended project reviewed, migrations verified, pg_cron enabled
-- via Dashboard Integrations > Cron, retention policy accepted, operator coverage.
-- Scheduled SQL executes as the scheduling postgres role without any API secret.
begin;
do $check$
begin
  if current_user <> 'postgres' then raise exception 'Use the authorized postgres operator role'; end if;
  if not exists(select 1 from pg_extension where extname = 'pg_cron') then raise exception 'Enable Supabase Cron before scheduling'; end if;
  if coalesce(current_setting('cron.timezone', true), 'GMT') not in ('GMT', 'UTC', 'Etc/UTC') then raise exception 'Review Cron timezone before using this UTC schedule'; end if;
  if to_regprocedure('public.maintain_quiet_corner()') is null then raise exception 'Quiet Corner maintenance RPC is missing'; end if;
  if has_function_privilege('anon', 'public.maintain_quiet_corner()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.maintain_quiet_corner()', 'EXECUTE') then
    raise exception 'Public maintenance permission must be revoked before scheduling';
  end if;
  if exists(select 1 from cron.job where jobname = 'taipei-faith-map-quiet-retention-v1'
    and (command <> 'select public.maintain_quiet_corner();' or username <> current_user or database <> current_database())) then
    raise exception 'An unexpected job already uses the application retention name; inspect manually';
  end if;
end;
$check$;
-- Named scheduling replaces this SAME owned job rather than adding duplicates.
-- 03:41 UTC / 11:41 Asia/Taipei; no network request, guest creation or public key.
select cron.schedule('taipei-faith-map-quiet-retention-v1', '41 3 * * *', 'select public.maintain_quiet_corner();') as retention_job_id;
commit;
