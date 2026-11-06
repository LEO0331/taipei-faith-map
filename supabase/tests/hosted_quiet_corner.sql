-- CONTROLLED EMPTY TARGET ONLY. Real hosted role/RPC tests, not JWT/Auth proof.
-- Use a stop-on-first-error runner (for psql: -v ON_ERROR_STOP=1).
-- Do not run bootstrap.sql on a hosted project. No permanent test helper is made.
-- Fixtures and the temporary transaction-local posting change are all rolled back;
-- other connections never see approved test notes or an enabled posting switch.

begin;
do $controlled_target$ begin
  if (select count(*) from public.quiet_notes) <> 0
     or (select count(*) from public.quiet_note_reports) <> 0
     or (select count(*) from public.quiet_rate_limits) <> 0
     or (select posting_enabled from public.quiet_corner_settings where id = 1) is distinct from false then
    raise exception 'Run only on an empty controlled Quiet Corner with posting off';
  end if;
end $controlled_target$;
insert into public.quiet_notes(id, content, author_key, status) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'An approved test note', repeat('a',64), 'approved'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'A pending test note', repeat('b',64), 'pending'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'A hidden test note', repeat('c',64), 'hidden');
insert into public.quiet_notes(id, content, author_key, status, created_at, expires_at) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'An expired test note', repeat('d',64), 'approved', now()-interval '40 days', now()-interval '10 days');
set local role anon;
do $hosted_assert$ begin if ((select count(*) = 1 from public.get_approved_quiet_notes(1000))) is distinct from true then raise exception 'public RPC exposes approved and unexpired notes only'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select bool_and(to_jsonb(n) ?& array['id','content','expires_at'] and (select count(*) from jsonb_object_keys(to_jsonb(n))) = 3) from public.get_approved_quiet_notes(15) n)) is distinct from true then raise exception 'RPC shape contains only intended public fields'; end if; end $hosted_assert$;
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
do $hosted_assert$ begin if ((select count(*) = 1 from public.get_approved_quiet_notes(15))) is distinct from true then raise exception 'anonymous Auth users see the same safe approved projection'; end if; end $hosted_assert$;
do $$ begin
  begin perform 1 from public.quiet_notes where status='pending'; raise exception 'guest pending read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.quiet_rate_limits; raise exception 'guest abuse metadata read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin update public.quiet_corner_settings set posting_enabled=true; raise exception 'guest posting switch unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin perform public.report_quiet_note(repeat('a',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam'); raise exception 'guest privileged reporting unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role service_role;
do $hosted_assert$ begin if (public.queue_quiet_note(repeat('e',64),'A test submission') = 'disabled') is distinct from true then raise exception 'posting starts disabled'; end if; end $hosted_assert$;
update public.quiet_corner_settings set posting_enabled=true where id=1;
do $hosted_assert$ begin if (public.queue_quiet_note(repeat('e',64),'A test submission') = 'received') is distinct from true then raise exception 'service queue inserts accepted submissions'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select bool_and(status='pending') from public.quiet_notes where author_key=repeat('e',64))) is distinct from true then raise exception 'every queued note is pending'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.queue_quiet_note(repeat('e',64),'Another test submission') = 'rate-limited') is distinct from true then raise exception 'rapid writes are rejected server-side'; end if; end $hosted_assert$;
update public.quiet_rate_limits set last_attempt_at=now()-interval '3 minutes' where actor_key=repeat('e',64) and action='submit';
do $hosted_assert$ begin if (public.queue_quiet_note(repeat('e',64),'A test submission') = 'duplicate') is distinct from true then raise exception 'same-actor duplicate is rejected'; end if; end $hosted_assert$;
update public.quiet_rate_limits set attempts=5,last_attempt_at=now()-interval '3 minutes' where actor_key=repeat('e',64) and action='submit';
do $hosted_assert$ begin if (public.queue_quiet_note(repeat('e',64),'Hourly cap test') = 'rate-limited') is distinct from true then raise exception 'hourly write budget is enforced'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.queue_quiet_note('not-a-hash','Invalid actor') = 'invalid') is distinct from true then raise exception 'invalid internal actor keys are rejected'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.moderate_quiet_note('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approve')) is distinct from true then raise exception 'privileged approval succeeds'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select status='approved' and reviewed_at is not null from public.quiet_notes where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) is distinct from true then raise exception 'approval stores its explicit review'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.moderate_quiet_note('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','hide')) is distinct from true then raise exception 'privileged hiding succeeds'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam') = 'received') is distinct from true then raise exception 'approved notes can be reported'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam') = 'rate-limited') is distinct from true then raise exception 'reports have a separate server budget'; end if; end $hosted_assert$;
update public.quiet_rate_limits set last_attempt_at=now()-interval '1 minute' where actor_key=repeat('f',64) and action='report';
do $hosted_assert$ begin if (public.report_quiet_note(repeat('f',64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','unsafe') = 'received') is distinct from true then raise exception 'repeated report acknowledged without duplication'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select count(*) = 1 from public.quiet_note_reports)) is distinct from true then raise exception 'one report per internal actor and note'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select status='approved' from public.quiet_notes where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')) is distinct from true then raise exception 'reports do not bypass operator moderation'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.report_quiet_note(repeat('1',64),'cccccccc-cccc-4ccc-8ccc-cccccccccccc','spam') = 'unavailable') is distinct from true then raise exception 'hidden notes cannot be reported as public notes'; end if; end $hosted_assert$;
do $hosted_assert$ begin if (public.moderate_quiet_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','delete')) is distinct from true then raise exception 'privileged deletion succeeds'; end if; end $hosted_assert$;
do $hosted_assert$ begin if ((select count(*) = 0 from public.quiet_note_reports)) is distinct from true then raise exception 'note deletion removes its reports'; end if; end $hosted_assert$;
insert into public.quiet_notes(content,author_key,status,created_at,expires_at) values('old pending',repeat('2',64),'pending',now()-interval '8 days',now()+interval '22 days');
select public.maintain_quiet_corner();
do $hosted_assert$ begin if (not exists(select 1 from public.quiet_notes where content in ('An expired test note','old pending'))) is distinct from true then raise exception 'maintenance expires old notes and pending drafts'; end if; end $hosted_assert$;
reset role;
rollback;



select 'hosted_transactional_sql_checks_passed' as result;
