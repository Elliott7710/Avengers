-- Manual policy verification for a disposable Supabase project.
-- Replace the three UUID placeholders with existing profiles/auth.users IDs:
--   employee_a: role employee; employee_b: role employee; manager: role manager.
-- Execute as a database administrator that can SET ROLE authenticated.
-- The whole transaction rolls back, including test records.

begin;

set local role authenticated;

-- Employee A creates one record in each table.
select set_config('request.jwt.claim.sub', 'EMPLOYEE_A_UUID', true);
insert into public.flowguard_travel_records (owner_id, record_id, data)
values (auth.uid(), 'RLS-TRAVEL-A', '{"destination":"A test"}');
insert into public.flowguard_insight_records (owner_id, record_id, data)
values (auth.uid(), 'RLS-INSIGHT-A', '{"team":"A test"}');

-- Employee B must not see A's rows, and cannot update or delete them.
select set_config('request.jwt.claim.sub', 'EMPLOYEE_B_UUID', true);
do $$
declare
  affected_rows integer;
begin
  if exists (select 1 from public.flowguard_travel_records where record_id = 'RLS-TRAVEL-A')
     or exists (select 1 from public.flowguard_insight_records where record_id = 'RLS-INSIGHT-A') then
    raise exception 'Isolation failure: employee B can read employee A records';
  end if;
  update public.flowguard_travel_records
  set data = '{"changed":true}'
  where record_id = 'RLS-TRAVEL-A';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Isolation failure: employee B changed employee A travel';
  end if;
  delete from public.flowguard_insight_records where record_id = 'RLS-INSIGHT-A';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Isolation failure: employee B deleted employee A insight';
  end if;
end
$$;

-- Employee B creates their own rows; employee A still cannot read them.
insert into public.flowguard_travel_records (owner_id, record_id, data)
values (auth.uid(), 'RLS-TRAVEL-B', '{"destination":"B test"}');
insert into public.flowguard_insight_records (owner_id, record_id, data)
values (auth.uid(), 'RLS-INSIGHT-B', '{"team":"B test"}');
select set_config('request.jwt.claim.sub', 'EMPLOYEE_A_UUID', true);
do $$
begin
  if exists (select 1 from public.flowguard_travel_records where record_id = 'RLS-TRAVEL-B')
     or exists (select 1 from public.flowguard_insight_records where record_id = 'RLS-INSIGHT-B') then
    raise exception 'Isolation failure: employee A can read employee B records';
  end if;
end
$$;

-- A manager can read records from both employees.
select set_config('request.jwt.claim.sub', 'MANAGER_UUID', true);
do $$
declare
  affected_rows integer;
begin
  if (select count(*) from public.flowguard_travel_records where record_id in ('RLS-TRAVEL-A', 'RLS-TRAVEL-B')) <> 2
     or (select count(*) from public.flowguard_insight_records where record_id in ('RLS-INSIGHT-A', 'RLS-INSIGHT-B')) <> 2 then
    raise exception 'Manager scope failure: manager cannot read both employees records';
  end if;

  update public.flowguard_travel_records
  set data = data || '{"manager_reviewed":true}'::jsonb
  where record_id in ('RLS-TRAVEL-A', 'RLS-TRAVEL-B');
  get diagnostics affected_rows = row_count;
  if affected_rows <> 2 then
    raise exception 'Manager scope failure: manager cannot update both travel records';
  end if;

  update public.flowguard_insight_records
  set data = data || '{"manager_reviewed":true}'::jsonb
  where record_id in ('RLS-INSIGHT-A', 'RLS-INSIGHT-B');
  get diagnostics affected_rows = row_count;
  if affected_rows <> 2 then
    raise exception 'Manager scope failure: manager cannot update both insight records';
  end if;

  begin
    update public.flowguard_travel_records
    set owner_id = auth.uid()
    where record_id = 'RLS-TRAVEL-A';
    raise exception 'Ownership guard failure: manager reassigned a record';
  exception
    when raise_exception then
      if sqlerrm <> 'Record ownership cannot be changed' then
        raise;
      end if;
  end;
end
$$;

rollback;
