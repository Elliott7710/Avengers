-- Disposable fixture only. Confirm upgrade preservation before resetting it.
do $$
begin
  if not exists (
    select 1 from public.flowguard_travel_records
    where record_id = 'BEFORE-TEAMS'
      and team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'
      and updated_at = created_at
      and data->>'purpose' = 'Upgrade rehearsal'
  ) then raise exception 'FAIL: travel backfill must preserve details and timestamps'; end if;
  if (select count(*) from public.flowguard_travel_activity
      where record_id = 'BEFORE-TEAMS') <> 1 then
    raise exception 'FAIL: backfill must not manufacture history';
  end if;
  if not exists (
    select 1 from public.flowguard_insight_records
    where record_id = 'BEFORE-TEAMS'
      and team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'
  ) then raise exception 'FAIL: insight backfill must preserve existing entries'; end if;
  if exists (
    select 1 from public.flowguard_team_members
    where user_id = '00000000-0000-0000-0000-000000000005'
  ) then raise exception 'FAIL: migration rerun must not autojoin new accounts'; end if;
end;
$$;
truncate public.flowguard_travel_records, public.flowguard_insight_records,
  public.flowguard_travel_activity;
