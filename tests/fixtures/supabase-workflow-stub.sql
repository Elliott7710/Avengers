-- Disposable local PostgreSQL ONLY. Minimal Supabase auth interfaces for tests.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true),'');
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid(), auth.role() to anon, authenticated;
