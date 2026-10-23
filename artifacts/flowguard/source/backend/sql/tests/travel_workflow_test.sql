-- Run via npm run test:workflow-db against the disposable local fixture only.
begin;
create schema fg_test;
grant usage on schema fg_test to authenticated, anon;
create function fg_test.check_ok(value boolean, description text)
returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'FAIL: %', description; end if;
end;
$$;
create function fg_test.denied(statement text, expected text)
returns void language plpgsql as $$
declare caught boolean := false;
begin
  begin execute statement;
  exception when others then
    if position(expected in sqlerrm) = 0 then raise; end if;
    caught := true;
  end;
  if not caught then raise exception 'FAIL: expected rejection: %', statement; end if;
end;
$$;
create function fg_test.payload(amount numeric default 800)
returns jsonb language sql as $$
  select jsonb_build_object('traveller','Synthetic Employee','destination','Demo City',
    'start','2026-11-02','end','2026-11-04','cost',amount,
    'purpose','Synthetic client meeting','status','Requested');
$$;
grant execute on all functions in schema fg_test to authenticated, anon;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select fg_test.check_ok(public.flowguard_travel_workflow_version() = 2,'team-scoped workflow version');
select fg_test.check_ok((select role='employee' and full_name='Synthetic Employee A'
  and username='employee_a' from public.profiles where id=auth.uid()),
  'signup creates a protected employee profile');

-- A synthetic employee submits; rule metadata is calculated, not trusted.
insert into public.flowguard_travel_records (id,owner_id,team_id,record_id,data) values
('10000000-0000-0000-0000-000000000001',auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','DEMO-APPROVE',
 fg_test.payload(1500) || '{"rule_code":"standard","rule_threshold":999999}');
select fg_test.check_ok(
  (select data->>'status' = 'Requested' and data->>'rule_code' = 'high_budget'
    and data->>'rule_threshold' = '1000' from public.flowguard_travel_records
    where record_id='DEMO-APPROVE'),'server computes budget flag');
select fg_test.check_ok((select count(*)=1 from public.flowguard_travel_activity
  where action='submitted'),'submission logged');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','BAD-STATUS',fg_test.payload() || '{"status":"Approved"}')$q$,'start as Requested');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','BAD-DATE',fg_test.payload() || '{"end":"2026-10-01"}')$q$,'Return date');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','BAD-CALENDAR',fg_test.payload() || '{"start":"2026-02-30"}')$q$,'valid departure');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','BAD-COST',fg_test.payload(-5))$q$,'non-negative');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','BAD-CENTS',fg_test.payload(1.001))$q$,'two decimal');
select fg_test.denied($q$insert into public.flowguard_travel_records(owner_id,team_id,record_id,data)
 values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','NO-COST',fg_test.payload() - 'cost')$q$,'non-negative');
select fg_test.denied($q$update public.flowguard_travel_records
 set data=data || '{"status":"Approved","decision_note":"I approve myself"}'
 where record_id='DEMO-APPROVE'$q$,'Only another manager');
select fg_test.denied($q$update public.profiles set role='manager' where id=auth.uid()$q$,
 'permission denied');
select fg_test.denied($q$select public.flowguard_decide_travel(
 '10000000-0000-0000-0000-000000000001','approve','Self approval',now())$q$,'Manager access required');
update public.flowguard_travel_records
 set data=jsonb_set(data,'{cost}','1000') where record_id='DEMO-APPROVE';
select fg_test.check_ok((select data->>'rule_code'='standard' from public.flowguard_travel_records
 where record_id='DEMO-APPROVE'),'edit re-evaluates budget at boundary');
select fg_test.check_ok((select count(*)=1 from public.flowguard_travel_activity
 where action='edited'),'edit logged');
select fg_test.denied($q$update public.flowguard_travel_activity set note='forged'$q$,'permission denied');
select fg_test.denied($q$delete from public.flowguard_travel_activity$q$,'permission denied');
select fg_test.denied($q$insert into public.flowguard_travel_activity
 (travel_id,owner_id,record_id,actor_role,action,note) values
 ('10000000-0000-0000-0000-000000000001',auth.uid(),'fake','manager','approved','fake')$q$,'permission denied');
\echo PASS submission, validation, edit, rule boundary, self-approval and audit tampering

-- Another employee cannot see or change the request OR its audit entries.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select fg_test.check_ok((select count(*)=0 from public.flowguard_travel_records),'employee request isolation');
select fg_test.check_ok((select count(*)=0 from public.flowguard_travel_activity),'employee log isolation');
with changed as (update public.flowguard_travel_records set data=fg_test.payload()
 where id='10000000-0000-0000-0000-000000000001' returning id)
select fg_test.check_ok((select count(*)=0 from changed),'employee cannot change another request');

-- Manager sees queue; must use allowed transitions and a note, cannot alter details.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select fg_test.check_ok((select count(*)=1 from public.flowguard_travel_records),'manager queue visibility');
select fg_test.denied($q$update public.flowguard_travel_records set data=data || '{"cost":1}'
 where record_id='DEMO-APPROVE'$q$,'Only the requester');
select fg_test.denied($q$update public.flowguard_travel_records
 set data=data || '{"status":"Approved","decision_note":"Looks good","cost":1}'
 where record_id='DEMO-APPROVE'$q$,'cannot change request details');
select fg_test.denied($q$select public.flowguard_decide_travel(id,'book','Booked',updated_at)
 from public.flowguard_travel_records where record_id='DEMO-APPROVE'$q$,'Invalid request status transition');
select fg_test.denied($q$select public.flowguard_decide_travel(id,'approve',' ',updated_at)
 from public.flowguard_travel_records where record_id='DEMO-APPROVE'$q$,'note of 1 to 1000');
select fg_test.denied($q$select public.flowguard_decide_travel(id,'approve','Reviewed','2000-01-01')
 from public.flowguard_travel_records where record_id='DEMO-APPROVE'$q$,'This request changed');
select public.flowguard_decide_travel(id,'approve','Reviewed cost and purpose',updated_at)
 from public.flowguard_travel_records where record_id='DEMO-APPROVE';
select fg_test.check_ok((select data->>'status'='Approved' from public.flowguard_travel_records
 where record_id='DEMO-APPROVE'),'approval persists');
select fg_test.denied($q$select public.flowguard_decide_travel(id,'approve','Duplicate',updated_at)
 from public.flowguard_travel_records where record_id='DEMO-APPROVE'$q$,'Only the requester');
select public.flowguard_decide_travel(id,'book','Synthetic booking confirmed',updated_at)
 from public.flowguard_travel_records where record_id='DEMO-APPROVE';
select fg_test.check_ok((select data->>'status'='Booked' from public.flowguard_travel_records
 where record_id='DEMO-APPROVE'),'booking persists');
select fg_test.check_ok((select count(*)=1 from public.flowguard_travel_activity
 where action='approved' and actor_role='manager' and note='Reviewed cost and purpose'),'approval logged');
select fg_test.check_ok((select count(*)=1 from public.flowguard_travel_activity
 where action='booked'),'booking logged');
select fg_test.denied($q$delete from public.flowguard_travel_records
 where record_id='DEMO-APPROVE'$q$,'Only the requester');

-- Manager's own request still needs a different manager.
insert into public.flowguard_travel_records(id,owner_id,team_id,record_id,data) values
('10000000-0000-0000-0000-000000000002',auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','MANAGER-OWN',fg_test.payload(0));
select fg_test.denied($q$select public.flowguard_decide_travel(id,'approve','My own request',updated_at)
 from public.flowguard_travel_records where record_id='MANAGER-OWN'$q$,'Only another manager');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select public.flowguard_decide_travel(id,'reject','Not required for this demo',updated_at)
 from public.flowguard_travel_records where record_id='MANAGER-OWN';
select fg_test.denied($q$select public.flowguard_decide_travel(id,'approve','Reopen',updated_at)
 from public.flowguard_travel_records where record_id='MANAGER-OWN'$q$,'Invalid request status transition');
\echo PASS cross-account isolation, manager approval, booking, rejection and stale-write protection

-- Employee sees outcomes but cannot rewrite/delete an approved or booked record.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select fg_test.check_ok((select data->>'status'='Booked' from public.flowguard_travel_records
 where record_id='DEMO-APPROVE'),'employee sees outcome');
select fg_test.check_ok((select count(*)=4 from public.flowguard_travel_activity),'employee sees full own journey only');
select fg_test.denied($q$update public.flowguard_travel_records set data=data || '{"cost":0}'
 where record_id='DEMO-APPROVE'$q$,'Only the requester');
insert into public.flowguard_travel_records(id,owner_id,team_id,record_id,data) values
('10000000-0000-0000-0000-000000000003',auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','DEMO-DELETE',fg_test.payload());
delete from public.flowguard_travel_records where record_id='DEMO-DELETE';
select fg_test.check_ok((select count(*)=2 from public.flowguard_travel_activity
 where record_id='DEMO-DELETE'),'deleted request log retained');
select fg_test.check_ok((select count(*)=0 from public.flowguard_travel_records
 where record_id='DEMO-DELETE'),'pending request removed');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','anon',true);
select fg_test.denied('select * from public.flowguard_travel_activity','permission denied');
select fg_test.denied('select public.flowguard_travel_workflow_version()','permission denied');
\echo PASS outcome visibility, final-state lock, deletion history and anonymous denial
rollback;
