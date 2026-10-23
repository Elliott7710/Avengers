-- FlowGuard travel and insights records.
-- Apply to the existing Supabase/PostgreSQL project as a trusted database
-- administrator. Browser clients must use the publishable/anon key only.

create table if not exists public.flowguard_travel_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, record_id),
  constraint flowguard_travel_data_object check (jsonb_typeof(data) = 'object')
);

create table if not exists public.flowguard_insight_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, record_id),
  constraint flowguard_insight_data_object check (jsonb_typeof(data) = 'object')
);

create or replace function public.flowguard_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and lower(trim(coalesce(p.role, 'employee'))) = 'manager'
  );
$$;

revoke all on function public.flowguard_is_manager() from public;
grant execute on function public.flowguard_is_manager() to authenticated;

-- Manager access is based on profiles.role. Prevent browser-authenticated
-- accounts from assigning themselves (or another account) a privileged role.
create or replace function public.flowguard_protect_profile_role()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.role := 'employee';
    elsif new.role is distinct from old.role then
      raise exception 'Only trusted administrators can change account roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists flowguard_protect_profile_role on public.profiles;
create trigger flowguard_protect_profile_role
before insert or update of role on public.profiles
for each row execute function public.flowguard_protect_profile_role();

create or replace function public.flowguard_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.flowguard_keep_record_owner()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Record ownership cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists flowguard_travel_updated_at on public.flowguard_travel_records;
create trigger flowguard_travel_updated_at
before update on public.flowguard_travel_records
for each row execute function public.flowguard_set_updated_at();

drop trigger if exists flowguard_insight_updated_at on public.flowguard_insight_records;
create trigger flowguard_insight_updated_at
before update on public.flowguard_insight_records
for each row execute function public.flowguard_set_updated_at();

drop trigger if exists flowguard_travel_owner_immutable on public.flowguard_travel_records;
create trigger flowguard_travel_owner_immutable
before update on public.flowguard_travel_records
for each row execute function public.flowguard_keep_record_owner();

drop trigger if exists flowguard_insight_owner_immutable on public.flowguard_insight_records;
create trigger flowguard_insight_owner_immutable
before update on public.flowguard_insight_records
for each row execute function public.flowguard_keep_record_owner();

alter table public.flowguard_travel_records enable row level security;
alter table public.flowguard_insight_records enable row level security;

grant select, insert, update, delete on public.flowguard_travel_records to authenticated;
grant select, insert, update, delete on public.flowguard_insight_records to authenticated;

drop policy if exists flowguard_travel_read_scope on public.flowguard_travel_records;
create policy flowguard_travel_read_scope on public.flowguard_travel_records
for select to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

drop policy if exists flowguard_travel_insert_owner on public.flowguard_travel_records;
create policy flowguard_travel_insert_owner on public.flowguard_travel_records
for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists flowguard_travel_update_scope on public.flowguard_travel_records;
create policy flowguard_travel_update_scope on public.flowguard_travel_records
for update to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()))
with check (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

drop policy if exists flowguard_travel_delete_scope on public.flowguard_travel_records;
create policy flowguard_travel_delete_scope on public.flowguard_travel_records
for delete to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

drop policy if exists flowguard_insight_read_scope on public.flowguard_insight_records;
create policy flowguard_insight_read_scope on public.flowguard_insight_records
for select to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

drop policy if exists flowguard_insight_insert_owner on public.flowguard_insight_records;
create policy flowguard_insight_insert_owner on public.flowguard_insight_records
for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists flowguard_insight_update_scope on public.flowguard_insight_records;
create policy flowguard_insight_update_scope on public.flowguard_insight_records
for update to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()))
with check (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));

drop policy if exists flowguard_insight_delete_scope on public.flowguard_insight_records;
create policy flowguard_insight_delete_scope on public.flowguard_insight_records
for delete to authenticated
using (owner_id = (select auth.uid()) or (select public.flowguard_is_manager()));
