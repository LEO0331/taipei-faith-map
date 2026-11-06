-- Read-only operator inspection. Never expose Cron tables through public RLS.
-- Run after deliberate scheduling; an active row alone is NOT a successful run.
select jobid, jobname, schedule, command, username, database, active
from cron.job where jobname = 'taipei-faith-map-quiet-retention-v1';
select d.jobid, d.runid, d.status, d.return_message, d.start_time, d.end_time
from cron.job_run_details d join cron.job j using (jobid)
where j.jobname = 'taipei-faith-map-quiet-retention-v1'
order by d.start_time desc limit 20;
-- Review missed/failed runs daily in Dashboard > Integrations > Cron > History.
-- This creates no external alerting integration. The operator owns observation.
