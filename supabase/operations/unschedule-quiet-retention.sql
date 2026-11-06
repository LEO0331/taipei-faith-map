-- Deliberate operator rollback of this application's retention schedule ONLY.
-- Unscheduling does not delete notes or disable posting. Pause posting separately
-- if maintenance will be unavailable. Never drop pg_cron: other jobs may use it.
begin;
do $check$
begin
  if current_user <> 'postgres' then raise exception 'Use the authorized postgres operator role'; end if;
  if exists(select 1 from cron.job where jobname = 'taipei-faith-map-quiet-retention-v1'
    and (command <> 'select public.maintain_quiet_corner();' or username <> current_user or database <> current_database())) then
    raise exception 'Unexpected retention job configuration; inspect manually';
  end if;
end;
$check$;
select cron.unschedule(jobid) as unscheduled
from cron.job where jobname = 'taipei-faith-map-quiet-retention-v1'
  and username = current_user and database = current_database();
commit;
