-- Disposable local fixture only; the workflow DB runner rolls this back.
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
grant execute on all functions in schema fg_test to authenticated, anon;

create temp table fg_teams_test_state (team_b uuid, invite uuid);
grant select, insert, update on fg_teams_test_state to authenticated;
insert into fg_teams_test_state default values;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);

-- A manager can create a second team and invite employees to it.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
update fg_teams_test_state set team_b = public.flowguard_create_team('Private Beta');
update fg_teams_test_state
set invite = public.flowguard_create_team_invite(team_b);
select fg_test.check_ok(team_b is not null and invite is not null,
  'team manager can create a team and invitation')
from fg_teams_test_state;

-- Invitees join as employees, even if the invite is shared.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select fg_test.check_ok(
  public.flowguard_join_team((select invite from fg_teams_test_state))
    = (select team_b from fg_teams_test_state),
  'valid invite joins selected team');
select fg_test.check_ok(
  (select role = 'employee' from public.flowguard_team_members
   where team_id = (select team_b from fg_teams_test_state) and user_id = auth.uid()),
  'invite cannot grant manager role');
select fg_test.check_ok(
  (select count(*) = 2 from public.flowguard_team_members where user_id = auth.uid()),
  'user can belong to multiple teams');
select fg_test.denied(
  $q$select public.flowguard_create_team_invite((select team_b from fg_teams_test_state))$q$,
  'Only a manager');

-- Team A employee creates shared Insights. Team B is isolated.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
insert into public.flowguard_insight_records(owner_id,team_id,record_id,data)
values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','INSIGHT-TEAM-A',
  '{"team":"Support","name":"Synthetic Team A","period":"2026-11-01","metric":"Resolved","value":8}');
select fg_test.denied(
  $q$insert into public.flowguard_insight_records(owner_id,team_id,record_id,data)
  values(auth.uid(),(select team_b from fg_teams_test_state),'CROSS-TEAM',
    '{"team":"Support","name":"Synthetic","period":"2026-11-01","metric":"Resolved","value":1}')$q$,
  'row-level security');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
insert into public.flowguard_insight_records(owner_id,team_id,record_id,data)
values(auth.uid(),'c8e78974-51f2-4d77-8c63-0efc53d11d9e','INSIGHT-TEAM-A-OTHER',
  '{"team":"Support","name":"Synthetic Team B member","period":"2026-11-01","metric":"Resolved","value":5}');
insert into public.flowguard_insight_records(owner_id,team_id,record_id,data)
values(auth.uid(),(select team_b from fg_teams_test_state),'INSIGHT-TEAM-B',
  '{"team":"Support","name":"Synthetic Team B","period":"2026-11-01","metric":"Resolved","value":4}');
select fg_test.check_ok(
  (select count(*) = 2 from public.flowguard_insight_records
   where team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'),
  'employee can read all Insights in a joined team');
select fg_test.check_ok(
  (select count(*) = 1 from public.flowguard_insight_records
   where team_id = (select team_b from fg_teams_test_state)),
  'multi-team member can read Insights in the other joined team');
with changed as (
  update public.flowguard_insight_records
  set data = data || '{"value":99}'
  where record_id = 'INSIGHT-TEAM-A'
  returning id
)
select fg_test.check_ok((select count(*) = 0 from changed),
  'employee cannot edit another member’s Insight');

-- Team-scoped managers see their own team, never another team's records.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select fg_test.check_ok(
  (select count(*) = 2 from public.flowguard_insight_records
   where team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'),
  'manager can view all Insights in their team');
select fg_test.check_ok(
  (select count(*) = 0 from public.flowguard_insight_records
   where team_id = (select team_b from fg_teams_test_state)),
  'manager cannot view another team’s Insights');
select fg_test.check_ok(
  public.flowguard_travel_workflow_version() = 2,
  'team-scoped travel workflow version');

reset role;
rollback;
