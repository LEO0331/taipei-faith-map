-- Enable the supported database-local scheduler on the dedicated backend.
-- This installs the extension only; scheduling the narrow, guarded application
-- job remains an explicit operator operation in supabase/operations/.
begin;
create extension if not exists pg_cron with schema pg_catalog;
commit;
