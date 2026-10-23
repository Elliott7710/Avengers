-- Disposable local PostgreSQL ONLY. Minimal Supabase auth interfaces for tests.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true),'');
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid(), auth.role() to anon, authenticated;
create table public.profiles (id uuid primary key references auth.users(id), role text not null);
insert into auth.users values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');
insert into public.profiles values
  ('00000000-0000-0000-0000-000000000001','employee'),
  ('00000000-0000-0000-0000-000000000002','employee'),
  ('00000000-0000-0000-0000-000000000003','manager'),
  ('00000000-0000-0000-0000-000000000004','manager');
alter table public.profiles enable row level security;
grant select,insert,update on public.profiles to authenticated;
create policy own_profile on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
