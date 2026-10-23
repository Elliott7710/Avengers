-- Privacy and account-deletion request intake.
-- Apply to a separate staging Supabase project first; do not apply directly to
-- production without reviewing the migration and retention requirements.

create table if not exists public.flowguard_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  request_type text not null
    check (request_type in ('deletion', 'access', 'correction', 'other')),
  details text
    check (details is null or char_length(details) <= 1000),
  status text not null default 'open'
    check (status in ('open', 'in_review', 'needs_info', 'completed')),
  created_at timestamptz not null default now()
);

-- Do not cascade-delete queued deletion requests with auth.users. Operators
-- need to process the request first; set a retention period before launch.
create index if not exists flowguard_privacy_requests_owner_created_idx
  on public.flowguard_privacy_requests (requester_id, created_at desc);

alter table public.flowguard_privacy_requests enable row level security;

revoke all on table public.flowguard_privacy_requests from public, anon, authenticated;
grant select (id, requester_id, request_type, details, status, created_at)
  on public.flowguard_privacy_requests to authenticated;
grant insert (requester_id, request_type, details)
  on public.flowguard_privacy_requests to authenticated;

drop policy if exists flowguard_privacy_requests_read_own
  on public.flowguard_privacy_requests;
create policy flowguard_privacy_requests_read_own
  on public.flowguard_privacy_requests
  for select to authenticated
  using (requester_id = (select auth.uid()));

drop policy if exists flowguard_privacy_requests_create_own
  on public.flowguard_privacy_requests;
create policy flowguard_privacy_requests_create_own
  on public.flowguard_privacy_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'open'
  );

-- No authenticated update/delete policy or grant. Workspace managers cannot
-- read other users' requests. FlowGuard operators process requests through
-- Supabase's trusted admin interface, not through the customer app.
