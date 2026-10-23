-- Apply AFTER travel_insights.sql in the SAME Supabase project as the frontend.
-- Additive: does not delete existing records or manufacture historical events.
-- Demo policy v1: MYR 1,000 flags a request; ALL requests need human approval.
begin;

create table if not exists public.flowguard_travel_activity (
  id uuid primary key default gen_random_uuid(),
  travel_id uuid not null,
  owner_id uuid not null,
  record_id text not null,
  actor_id uuid,
  actor_role text not null,
  action text not null check (action in ('submitted','edited','approved','rejected','booked','deleted')),
  from_status text,
  to_status text,
  note text not null,
  rule_code text,
  created_at timestamptz not null default clock_timestamp()
);
-- Deliberately no request FK: deletion of a pending request must retain its log.
create index if not exists flowguard_activity_request_time
  on public.flowguard_travel_activity (travel_id, created_at desc);
create index if not exists flowguard_activity_owner_time
  on public.flowguard_travel_activity (owner_id, created_at desc);
alter table public.flowguard_travel_activity enable row level security;
revoke all on public.flowguard_travel_activity from public, anon, authenticated;
grant select on public.flowguard_travel_activity to authenticated;
drop policy if exists flowguard_activity_read_scope on public.flowguard_travel_activity;
create policy flowguard_activity_read_scope on public.flowguard_travel_activity
for select to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

create or replace function public.flowguard_validate_travel(payload jsonb)
returns void language plpgsql set search_path = pg_catalog as $$
declare
  field text;
  departure date;
  return_date date;
  amount numeric;
begin
  foreach field in array array['traveller','destination','start','end','purpose'] loop
    if jsonb_typeof(payload->field) is distinct from 'string'
       or length(trim(payload->>field)) = 0 then
      raise exception 'Traveller, destination, departure, return and purpose are required';
    end if;
  end loop;
  if (payload->>'start') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     or (payload->>'end') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Enter valid departure and return dates';
  end if;
  begin
    departure := (payload->>'start')::date;
    return_date := (payload->>'end')::date;
  exception when others then
    raise exception 'Enter valid departure and return dates';
  end;
  if return_date < departure then raise exception 'Return date cannot be before departure'; end if;
  if jsonb_typeof(payload->'cost') not in ('number','string')
     or coalesce(payload->>'cost','') !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Estimated cost must be a non-negative amount with at most two decimal places';
  end if;
  amount := (payload->>'cost')::numeric;
  if amount > 999999999.99 then raise exception 'Estimated cost exceeds the supported maximum'; end if;
end;
$$;
revoke all on function public.flowguard_validate_travel(jsonb) from public, anon, authenticated;

create or replace function public.flowguard_guard_travel_workflow()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare
  uid uuid := auth.uid();
  manager boolean := public.flowguard_is_manager();
  previous text;
  following text;
begin
  if uid is null then raise exception 'Sign in before changing travel requests'; end if;
  if tg_op = 'DELETE' then
    if old.owner_id <> uid or old.data->>'status' is distinct from 'Requested' then
      raise exception 'Only the requester can delete a pending request';
    end if;
    return old;
  end if;
  perform public.flowguard_validate_travel(new.data);
  following := new.data->>'status';
  if following is null or following not in ('Requested','Approved','Rejected','Booked') then
    raise exception 'Unknown request status';
  end if;
  if tg_op = 'INSERT' then
    if new.owner_id <> uid or following is distinct from 'Requested' then
      raise exception 'New requests must belong to you and start as Requested';
    end if;
    new.data := new.data - 'decision_note';
  else
    if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id
       or new.record_id is distinct from old.record_id or new.created_at is distinct from old.created_at then
      raise exception 'Request identity and ownership cannot be changed';
    end if;
    previous := old.data->>'status';
    if following is not distinct from previous then
      if old.owner_id <> uid or previous <> 'Requested' then
        raise exception 'Only the requester can edit a pending request';
      end if;
      new.data := new.data - 'decision_note';
    else
      if not manager or old.owner_id = uid then
        raise exception 'Only another manager can approve, reject or book a request';
      end if;
      if not ((previous = 'Requested' and following in ('Approved','Rejected'))
           or (previous = 'Approved' and following = 'Booked')) then
        raise exception 'Invalid request status transition';
      end if;
      if (new.data - 'status' - 'decision_note') is distinct from (old.data - 'status' - 'decision_note') then
        raise exception 'Review actions cannot change request details';
      end if;
      if jsonb_typeof(new.data->'decision_note') is distinct from 'string'
         or coalesce(length(trim(new.data->>'decision_note')),0) not between 1 and 1000 then
        raise exception 'A decision or booking note of 1 to 1000 characters is required';
      end if;
      new.data := jsonb_set(new.data, '{decision_note}', to_jsonb(trim(new.data->>'decision_note')));
    end if;
  end if;
  -- Always calculate these on the database; never trust browser-supplied flags.
  new.data := new.data || jsonb_build_object(
    'rule_code', case when (new.data->>'cost')::numeric > 1000 then 'high_budget' else 'standard' end,
    'rule_threshold', 1000);
  return new;
end;
$$;
revoke all on function public.flowguard_guard_travel_workflow() from public, anon, authenticated;
drop trigger if exists flowguard_travel_workflow_guard on public.flowguard_travel_records;
create trigger flowguard_travel_workflow_guard
before insert or update or delete on public.flowguard_travel_records
for each row execute function public.flowguard_guard_travel_workflow();

create or replace function public.flowguard_log_travel_workflow()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare
  rec public.flowguard_travel_records;
  event text;
  previous text;
  following text;
  message text;
begin
  if tg_op = 'DELETE' then
    rec := old;
    previous := old.data->>'status';
    event := 'deleted';
    message := 'Pending request deleted.';
  else
    rec := new;
    following := new.data->>'status';
    if tg_op = 'INSERT' then
      event := 'submitted';
      message := 'Request submitted for manager approval.';
    else
      previous := old.data->>'status';
      if following is not distinct from previous then
        -- Avoid noisy events for exact retries/no-op writes.
        if new.data = old.data then return new; end if;
        event := 'edited';
        message := 'Pending request details updated; budget rule re-evaluated.';
      else
        event := lower(following);
        message := new.data->>'decision_note';
      end if;
    end if;
  end if;
  insert into public.flowguard_travel_activity
    (travel_id,owner_id,record_id,actor_id,actor_role,action,from_status,to_status,note,rule_code)
  values
    (rec.id,rec.owner_id,rec.record_id,auth.uid(),
     case when public.flowguard_is_manager() then 'manager' else 'employee' end,
     event,previous,following,message,rec.data->>'rule_code');
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.flowguard_log_travel_workflow() from public, anon, authenticated;
drop trigger if exists flowguard_travel_workflow_log on public.flowguard_travel_records;
create trigger flowguard_travel_workflow_log
after insert or update or delete on public.flowguard_travel_records
for each row execute function public.flowguard_log_travel_workflow();

create or replace function public.flowguard_decide_travel(
  p_id uuid, p_action text, p_note text, p_expected_updated_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  rec public.flowguard_travel_records;
  target text;
begin
  if not public.flowguard_is_manager() then raise exception 'Manager access required'; end if;
  target := case p_action when 'approve' then 'Approved' when 'reject' then 'Rejected' when 'book' then 'Booked' else null end;
  if target is null then raise exception 'Unknown review action'; end if;
  select * into rec from public.flowguard_travel_records where id = p_id for update;
  if not found then raise exception 'This request is no longer available'; end if;
  if rec.updated_at is distinct from p_expected_updated_at then
    raise exception 'This request changed. Refresh it before deciding';
  end if;
  update public.flowguard_travel_records
    set data = rec.data || jsonb_build_object('status',target,'decision_note',p_note)
    where id = p_id returning * into rec;
  return to_jsonb(rec);
end;
$$;
revoke all on function public.flowguard_decide_travel(uuid,text,text,timestamptz) from public, anon;
grant execute on function public.flowguard_decide_travel(uuid,text,text,timestamptz) to authenticated;

create or replace function public.flowguard_travel_workflow_version()
returns integer language sql stable set search_path = pg_catalog as $$ select 1; $$;
revoke all on function public.flowguard_travel_workflow_version() from public, anon;
grant execute on function public.flowguard_travel_workflow_version() to authenticated;
commit;
