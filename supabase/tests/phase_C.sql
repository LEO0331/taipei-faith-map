\set ON_ERROR_STOP on
begin;
insert into public.quiet_notes(id, content, author_key, status) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'An approved test note', repeat('a',64), 'approved'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'A pending test note', repeat('b',64), 'pending'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'A hidden test note', repeat('c',64), 'hidden');
insert into public.quiet_notes(id, content, author_key, status, created_at, expires_at) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'An expired test note', repeat('d',64), 'approved', now()-interval '40 days', now()-interval '10 days');
set local role anon;
select public.quiet_test_assert((select count(*) = 1 from public.get_approved_quiet_notes(1000)), 'public RPC exposes approved and unexpired notes only');
select public.quiet_test_assert((select bool_and(to_jsonb(n) ?& array['id','content','expires_at'] and (select count(*) from jsonb_object_keys(to_jsonb(n))) = 3) from public.get_approved_quiet_notes(15) n), 'RPC shape contains only intended public fields');
do $$ begin
  begin perform 1 from public.quiet_notes; raise exception 'raw note read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.quiet_notes(content,author_key,status) values ('public insert',repeat('a',64),'approved'); raise exception 'public insert unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin update public.quiet_notes set status='approved'; raise exception 'public approval unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.quiet_notes; raise exception 'public delete unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.quiet_note_reports; raise exception 'public report read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.queue_quiet_note(repeat('a',64),'bypass'); raise exception 'public queue RPC unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.moderate_quiet_note('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approve'); raise exception 'public moderation unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","is_anonymous":true}', true);
select public.quiet_test_assert((select count(*) = 1 from public.get_approved_quiet_notes(15)), 'anonymous Auth users see the same safe approved projection');
do $$ begin
  begin perform 1 from public.quiet_notes where status='pending'; raise exception 'guest pending read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.quiet_rate_limits; raise exception 'guest abuse metadata read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin update public.quiet_corner_settings set posting_enabled=true; raise exception 'guest posting switch unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.report_quiet_note(repeat('a',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam'); raise exception 'guest privileged reporting unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role service_role;
select public.quiet_test_assert(public.queue_quiet_note(repeat('e',64),'A test submission') = 'disabled', 'posting starts disabled');
update public.quiet_corner_settings set posting_enabled=true where id=1;
select public.quiet_test_assert(public.queue_quiet_note(repeat('e',64),'A test submission') = 'received', 'service queue inserts accepted submissions');
select public.quiet_test_assert((select bool_and(status='pending') from public.quiet_notes where author_key=repeat('e',64)), 'every queued note is pending');
select public.quiet_test_assert(public.queue_quiet_note(repeat('e',64),'Another test submission') = 'rate-limited', 'rapid writes are rejected server-side');
update public.quiet_rate_limits set last_attempt_at=now()-interval '3 minutes' where actor_key=repeat('e',64) and action='submit';
select public.quiet_test_assert(public.queue_quiet_note(repeat('e',64),'A test submission') = 'duplicate', 'same-actor duplicate is rejected');
update public.quiet_rate_limits set attempts=5,last_attempt_at=now()-interval '3 minutes' where actor_key=repeat('e',64) and action='submit';
select public.quiet_test_assert(public.queue_quiet_note(repeat('e',64),'Hourly cap test') = 'rate-limited', 'hourly write budget is enforced');
select public.quiet_test_assert(public.queue_quiet_note('not-a-hash','Invalid actor') = 'invalid', 'invalid internal actor keys are rejected');
select public.quiet_test_assert(public.moderate_quiet_note('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approve'), 'privileged approval succeeds');
select public.quiet_test_assert((select status='approved' and reviewed_at is not null from public.quiet_notes where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 'approval stores its explicit review');
select public.quiet_test_assert(public.moderate_quiet_note('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','hide'), 'privileged hiding succeeds');
select public.quiet_test_assert(public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam') = 'received', 'approved notes can be reported');
select public.quiet_test_assert(public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam') = 'rate-limited', 'reports have a separate server budget');
update public.quiet_rate_limits set last_attempt_at=now()-interval '1 minute' where actor_key=repeat('f',64) and action='report';
select public.quiet_test_assert(public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','unsafe') = 'received', 'repeated report acknowledged without duplication');
select public.quiet_test_assert((select count(*) = 1 from public.quiet_note_reports), 'one report per internal actor and note');
select public.quiet_test_assert((select status='approved' from public.quiet_notes where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 'reports do not bypass operator moderation');
select public.quiet_test_assert(public.report_quiet_note(repeat('1',64),'cccccccc-cccc-4ccc-8ccc-cccccccccccc','spam') = 'unavailable', 'hidden notes cannot be reported as public notes');
select public.quiet_test_assert(public.moderate_quiet_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','delete'), 'privileged deletion succeeds');
select public.quiet_test_assert((select count(*) = 0 from public.quiet_note_reports), 'note deletion removes its reports');
insert into public.quiet_notes(content,author_key,status,created_at,expires_at) values('old pending',repeat('2',64),'pending',now()-interval '8 days',now()+interval '22 days');
select public.maintain_quiet_corner();
select public.quiet_test_assert(not exists(select 1 from public.quiet_notes where content in ('An expired test note','old pending')), 'maintenance expires old notes and pending drafts');
reset role;
rollback;
\echo 'Phase C PostgreSQL RLS, approved-only publication, moderation, rate, duplicate and retention checks passed.'
