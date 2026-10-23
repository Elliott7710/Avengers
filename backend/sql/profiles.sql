-- First-install profile foundation for a NEW FlowGuard Supabase project.
-- Run as the trusted database owner in the intended project. This does not
-- create, promote, or modify any existing auth.users rows.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee'
    check (role in ('employee','manager')),
  full_name text not null default ''
    check (char_length(full_name) <= 200),
  username text
    check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists flowguard_profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists flowguard_profiles_read_own on public.profiles;
create policy flowguard_profiles_read_own on public.profiles
for select to authenticated using (id = (select auth.uid()));

create or replace function public.flowguard_protect_profile_role()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if auth.role() in ('anon','authenticated') then
    if tg_op = 'INSERT' then
      new.role := 'employee';
    elsif new.role is distinct from old.role then
      raise exception 'Only trusted administrators can change account roles';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.flowguard_protect_profile_role() from public, anon, authenticated;
drop trigger if exists flowguard_protect_profile_role on public.profiles;
create trigger flowguard_protect_profile_role
before insert or update of role on public.profiles
for each row execute function public.flowguard_protect_profile_role();

create or replace function public.flowguard_create_profile_for_auth_user()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public as $$
declare
  supplied_name text := coalesce(new.raw_user_meta_data->>'full_name','');
  supplied_username text := new.raw_user_meta_data->>'username';
begin
  insert into public.profiles (id,role,full_name,username)
  values (
    new.id,
    'employee',
    left(trim(supplied_name),200),
    case when supplied_username ~ '^[A-Za-z0-9_]{3,30}$'
      then supplied_username else null end
  );
  return new;
end;
$$;
revoke all on function public.flowguard_create_profile_for_auth_user() from public, anon, authenticated;

drop trigger if exists flowguard_create_profile_for_auth_user on auth.users;
create trigger flowguard_create_profile_for_auth_user
after insert on auth.users
for each row execute function public.flowguard_create_profile_for_auth_user();

commit;
