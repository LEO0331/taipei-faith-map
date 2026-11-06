\set ON_ERROR_STOP on
begin;
set local role anon;
select public.quiet_test_assert((select count(*) = 1 and min(status) = 'ok' from public.app_healthcheck), 'public health check reads the one static record');
do $$ begin
  begin insert into public.app_healthcheck values (1, 'ok'); raise exception 'public health insert unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin update public.app_healthcheck set status = 'ok'; raise exception 'public health update unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.app_healthcheck; raise exception 'public health delete unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into realtime.messages(extension) values ('presence'), ('broadcast'), ('postgres_changes');
set local role anon;
select set_config('request.jwt.claims', '{}', true), set_config('realtime.topic', 'quiet-garden:v1', true);
select public.quiet_test_assert((select count(*) = 0 from realtime.messages), 'unauthenticated clients cannot receive garden messages');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","is_anonymous":true}', true);
select public.quiet_test_assert((select count(*) = 2 from realtime.messages), 'verified anonymous claims can receive only presence and broadcast');
insert into realtime.messages(extension) values ('presence'), ('broadcast');
do $$ begin
  begin insert into realtime.messages(extension) values ('postgres_changes'); raise exception 'unsupported realtime extension unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('realtime.topic', 'another-topic', true);
select public.quiet_test_assert((select count(*) = 0 from realtime.messages), 'arbitrary topics are not authorized');
do $$ begin
  begin insert into realtime.messages(extension) values ('presence'); raise exception 'wrong-topic tracking unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('realtime.topic', 'quiet-garden:v1', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","is_anonymous":false}', true);
select public.quiet_test_assert((select count(*) = 0 from realtime.messages), 'permanent users are not treated as anonymous guests');
do $$ begin
  begin insert into realtime.messages(extension) values ('broadcast'); raise exception 'non-guest broadcast unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo 'Phase B PostgreSQL authorization checks passed (standalone role fixtures, not a live Realtime test).'
