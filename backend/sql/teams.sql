-- FlowGuard team isolation and invitations.
-- Apply AFTER profiles.sql, travel_insights.sql, privacy_requests.sql, and
-- travel_workflow.sql. This migration preserves existing records and places
-- the current workspace into one initial team.
begin;

create table if not exists public.flowguard_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.flowguard_team_members (
  team_id uuid not null references public.flowguard_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'employee' check (role in ('employee','manager')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists flowguard_team_members_user_idx
  on public.flowguard_team_members (user_id, joined_at);

create table if not exists public.flowguard_team_invites (
  token uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.flowguard_teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses integer not null default 20 check (max_uses between 1 and 100),
  used_count integer not null default 0 check (used_count >= 0)
);
create index if not exists flowguard_team_invites_team_idx
  on public.flowguard_team_invites (team_id, expires_at);

-- Existing accounts and records predate teams. A trusted initial manager
-- establishes the first team; existing workspace data is assigned to it.
do $$
declare
  bootstrap_manager uuid;
  bootstrap_team constant uuid := 'c8e78974-51f2-4d77-8c63-0efc53d11d9e';
begin
  select p.id into bootstrap_manager
  from public.profiles p
  where lower(trim(coalesce(p.role, 'employee'))) = 'manager'
  order by p.created_at, p.id
  limit 1;

  if bootstrap_manager is null then
    raise exception 'Create or promote one synthetic manager account before applying teams.sql.';
  end if;

  insert into public.flowguard_teams (id, name, created_by)
  values (bootstrap_team, 'FlowGuard Demo Team', bootstrap_manager)
  on conflict (id) do nothing;

  insert into public.flowguard_team_members (team_id, user_id, role)
  select bootstrap_team, p.id,
    case when lower(trim(coalesce(p.role, 'employee'))) = 'manager'
      then 'manager' else 'employee' end
  from public.profiles p
  on conflict (team_id, user_id) do nothing;
end;
$$;

alter table public.flowguard_travel_records
  add column if not exists team_id uuid references public.flowguard_teams(id) on delete restrict;
alter table public.flowguard_insight_records
  add column if not exists team_id uuid references public.flowguard_teams(id) on delete restrict;
alter table public.flowguard_travel_activity
  add column if not exists team_id uuid references public.flowguard_teams(id) on delete restrict;

update public.flowguard_travel_records
set team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'
where team_id is null;
update public.flowguard_insight_records
set team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'
where team_id is null;
update public.flowguard_travel_activity
set team_id = 'c8e78974-51f2-4d77-8c63-0efc53d11d9e'
where team_id is null;

alter table public.flowguard_travel_records alter column team_id set not null;
alter table public.flowguard_insight_records alter column team_id set not null;
alter table public.flowguard_travel_activity alter column team_id set not null;

alter table public.flowguard_travel_records
  drop constraint if exists flowguard_travel_records_owner_id_record_id_key;
alter table public.flowguard_insight_records
  drop constraint if exists flowguard_insight_records_owner_id_record_id_key;
create unique index if not exists flowguard_travel_team_owner_record_unique
  on public.flowguard_travel_records (team_id, owner_id, record_id);
create unique index if not exists flowguard_insight_team_owner_record_unique
  on public.flowguard_insight_records (team_id, owner_id, record_id);
create index if not exists flowguard_travel_team_created_idx
  on public.flowguard_travel_records (team_id, created_at desc);
create index if not exists flowguard_insight_team_created_idx
  on public.flowguard_insight_records (team_id, created_at desc);
create index if not exists flowguard_activity_team_time_idx
  on public.flowguard_travel_activity (team_id, created_at desc);

create or replace function public.flowguard_is_team_member(p_team_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.flowguard_team_members m
    where m.team_id = p_team_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.flowguard_is_team_manager(p_team_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.flowguard_team_members m
    where m.team_id = p_team_id
      and m.user_id = (select auth.uid())
      and m.role = 'manager'
  );
$$;

revoke all on function public.flowguard_is_team_member(uuid) from public, anon;
revoke all on function public.flowguard_is_team_manager(uuid) from public, anon;
grant execute on function public.flowguard_is_team_member(uuid) to authenticated;
grant execute on function public.flowguard_is_team_manager(uuid) to authenticated;

create or replace function public.flowguard_create_team(p_name text)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  new_team_id uuid;
  clean_name text := trim(coalesce(p_name, ''));
begin
  if uid is null then raise exception 'Sign in before creating a team'; end if;
  if not exists (
    select 1 from public.flowguard_team_members m
    where m.user_id = uid and m.role = 'manager'
  ) then
    raise exception 'Only a manager can create a team';
  end if;
  if char_length(clean_name) not between 2 and 80 then
    raise exception 'Team names must be 2 to 80 characters';
  end if;

  insert into public.flowguard_teams (name, created_by)
  values (clean_name, uid)
  returning id into new_team_id;

  insert into public.flowguard_team_members (team_id, user_id, role)
  values (new_team_id, uid, 'manager');
  return new_team_id;
end;
$$;

create or replace function public.flowguard_create_team_invite(p_team_id uuid)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  invite_token uuid;
begin
  if uid is null or not public.flowguard_is_team_manager(p_team_id) then
    raise exception 'Only a manager of this team can create an invite';
  end if;

  insert into public.flowguard_team_invites
    (team_id, created_by, expires_at, max_uses)
  values (p_team_id, uid, now() + interval '7 days', 20)
  returning token into invite_token;
  return invite_token;
end;
$$;

create or replace function public.flowguard_join_team(p_token uuid)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  invite public.flowguard_team_invites;
begin
  if uid is null then raise exception 'Sign in before joining a team'; end if;
  select * into invite
  from public.flowguard_team_invites i
  where i.token = p_token
  for update;
  if not found or invite.expires_at <= now() then
    raise exception 'This invite code is invalid or expired';
  end if;

  if exists (
    select 1 from public.flowguard_team_members m
    where m.team_id = invite.team_id and m.user_id = uid
  ) then
    return invite.team_id;
  end if;
  if invite.used_count >= invite.max_uses then
    raise exception 'This invite code has reached its member limit';
  end if;

  update public.flowguard_team_invites
  set used_count = used_count + 1
  where token = invite.token;

  insert into public.flowguard_team_members (team_id, user_id, role)
  values (invite.team_id, uid, 'employee');
  return invite.team_id;
end;
$$;

revoke all on function public.flowguard_create_team(text) from public, anon;
revoke all on function public.flowguard_create_team_invite(uuid) from public, anon;
revoke all on function public.flowguard_join_team(uuid) from public, anon;
grant execute on function public.flowguard_create_team(text) to authenticated;
grant execute on function public.flowguard_create_team_invite(uuid) to authenticated;
grant execute on function public.flowguard_join_team(uuid) to authenticated;

alter table public.flowguard_teams enable row level security;
alter table public.flowguard_team_members enable row level security;
alter table public.flowguard_team_invites enable row level security;
revoke all on public.flowguard_teams from public, anon, authenticated;
revoke all on public.flowguard_team_members from public, anon, authenticated;
revoke all on public.flowguard_team_invites from public, anon, authenticated;
grant select on public.flowguard_teams, public.flowguard_team_members to authenticated;

drop policy if exists flowguard_teams_read_members on public.flowguard_teams;
create policy flowguard_teams_read_members on public.flowguard_teams
for select to authenticated
using (public.flowguard_is_team_member(id));

drop policy if exists flowguard_members_read_own on public.flowguard_team_members;
create policy flowguard_members_read_own on public.flowguard_team_members
for select to authenticated
using (user_id = (select auth.uid()));

alter table public.flowguard_travel_records enable row level security;
alter table public.flowguard_insight_records enable row level security;
alter table public.flowguard_travel_activity enable row level security;
revoke all on public.flowguard_travel_records from public, anon, authenticated;
revoke all on public.flowguard_insight_records from public, anon, authenticated;
revoke all on public.flowguard_travel_activity from public, anon, authenticated;
grant select, insert, update, delete on public.flowguard_travel_records to authenticated;
grant select, insert, update, delete on public.flowguard_insight_records to authenticated;
grant select on public.flowguard_travel_activity to authenticated;

drop policy if exists flowguard_travel_read_scope on public.flowguard_travel_records;
create policy flowguard_travel_read_scope on public.flowguard_travel_records
for select to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);
drop policy if exists flowguard_travel_insert_owner on public.flowguard_travel_records;
create policy flowguard_travel_insert_owner on public.flowguard_travel_records
for insert to authenticated
with check (owner_id = (select auth.uid()) and public.flowguard_is_team_member(team_id));
drop policy if exists flowguard_travel_update_scope on public.flowguard_travel_records;
create policy flowguard_travel_update_scope on public.flowguard_travel_records
for update to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
)
with check (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);
drop policy if exists flowguard_travel_delete_scope on public.flowguard_travel_records;
create policy flowguard_travel_delete_scope on public.flowguard_travel_records
for delete to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);

drop policy if exists flowguard_insight_read_scope on public.flowguard_insight_records;
create policy flowguard_insight_read_scope on public.flowguard_insight_records
for select to authenticated
using (public.flowguard_is_team_member(team_id));
drop policy if exists flowguard_insight_insert_owner on public.flowguard_insight_records;
create policy flowguard_insight_insert_owner on public.flowguard_insight_records
for insert to authenticated
with check (owner_id = (select auth.uid()) and public.flowguard_is_team_member(team_id));
drop policy if exists flowguard_insight_update_scope on public.flowguard_insight_records;
create policy flowguard_insight_update_scope on public.flowguard_insight_records
for update to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
)
with check (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);
drop policy if exists flowguard_insight_delete_scope on public.flowguard_insight_records;
create policy flowguard_insight_delete_scope on public.flowguard_insight_records
for delete to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);

drop policy if exists flowguard_activity_read_scope on public.flowguard_travel_activity;
create policy flowguard_activity_read_scope on public.flowguard_travel_activity
for select to authenticated
using (
  public.flowguard_is_team_member(team_id)
  and (owner_id = (select auth.uid()) or public.flowguard_is_team_manager(team_id))
);

create or replace function public.flowguard_keep_record_owner()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.owner_id is distinct from old.owner_id
     or new.team_id is distinct from old.team_id then
    raise exception 'Record ownership and team cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.flowguard_guard_travel_workflow()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  previous text;
  following text;
  team uuid;
  manager boolean;
begin
  team := case when tg_op = 'DELETE' then old.team_id else new.team_id end;
  manager := public.flowguard_is_team_manager(team);
  if uid is null then raise exception 'Sign in before changing travel requests'; end if;
  if not public.flowguard_is_team_member(team) then
    raise exception 'Join this team before changing its travel requests';
  end if;

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
       or new.team_id is distinct from old.team_id
       or new.record_id is distinct from old.record_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Request identity, ownership and team cannot be changed';
    end if;
    previous := old.data->>'status';
    if following is not distinct from previous then
      if old.owner_id <> uid or previous <> 'Requested' then
        raise exception 'Only the requester can edit a pending request';
      end if;
      new.data := new.data - 'decision_note';
    else
      if not manager or old.owner_id = uid then
        raise exception 'Only another manager in this team can approve, reject or book a request';
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

  new.data := new.data || jsonb_build_object(
    'rule_code', case when (new.data->>'cost')::numeric > 1000 then 'high_budget' else 'standard' end,
    'rule_threshold', 1000);
  return new;
end;
$$;

create or replace function public.flowguard_log_travel_workflow()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
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
    (travel_id,team_id,owner_id,record_id,actor_id,actor_role,action,from_status,to_status,note,rule_code)
  values
    (rec.id,rec.team_id,rec.owner_id,rec.record_id,auth.uid(),
     case when public.flowguard_is_team_manager(rec.team_id) then 'manager' else 'employee' end,
     event,previous,following,message,rec.data->>'rule_code');
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists flowguard_travel_workflow_guard on public.flowguard_travel_records;
create trigger flowguard_travel_workflow_guard
before insert or update or delete on public.flowguard_travel_records
for each row execute function public.flowguard_guard_travel_workflow();
drop trigger if exists flowguard_travel_workflow_log on public.flowguard_travel_records;
create trigger flowguard_travel_workflow_log
after insert or update or delete on public.flowguard_travel_records
for each row execute function public.flowguard_log_travel_workflow();

create or replace function public.flowguard_decide_travel(
  p_id uuid, p_action text, p_note text, p_expected_updated_at timestamptz
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog
as $$
declare
  rec public.flowguard_travel_records;
  target text;
begin
  target := case p_action when 'approve' then 'Approved'
    when 'reject' then 'Rejected' when 'book' then 'Booked' else null end;
  if target is null then raise exception 'Unknown review action'; end if;

  select * into rec from public.flowguard_travel_records where id = p_id for update;
  if not found then raise exception 'This request is no longer available'; end if;
  if not public.flowguard_is_team_manager(rec.team_id) then
    raise exception 'Manager access required for this team';
  end if;
  if rec.updated_at is distinct from p_expected_updated_at then
    raise exception 'This request changed. Refresh it before deciding';
  end if;
  update public.flowguard_travel_records
    set data = rec.data || jsonb_build_object('status',target,'decision_note',p_note)
    where id = p_id returning * into rec;
  return to_jsonb(rec);
end;
$$;

create or replace function public.flowguard_travel_workflow_version()
returns integer language sql stable set search_path = pg_catalog as $$ select 2; $$;
revoke all on function public.flowguard_decide_travel(uuid,text,text,timestamptz) from public, anon;
revoke all on function public.flowguard_travel_workflow_version() from public, anon;
grant execute on function public.flowguard_decide_travel(uuid,text,text,timestamptz) to authenticated;
grant execute on function public.flowguard_travel_workflow_version() to authenticated;

drop function if exists public.flowguard_is_manager();

commit;
