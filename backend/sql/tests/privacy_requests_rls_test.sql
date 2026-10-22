-- Manual isolation test for a disposable Supabase staging project.
-- Requires existing auth.users/profiles for two employees and one manager.
-- Replace placeholders and execute as an administrator that can SET ROLE.
-- The transaction rolls back all inserted test rows.

begin;

set local role anon;
do $$
begin
  begin
    insert into public.flowguard_privacy_requests
      (requester_id, request_type, details)
    values ('EMPLOYEE_A_UUID', 'deletion', 'TEST-ANON');
    raise exception 'Privacy request access failure: anon inserted a request';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'EMPLOYEE_A_UUID', true);

insert into public.flowguard_privacy_requests (requester_id, request_type, details)
values (auth.uid(), 'deletion', 'TEST-REQUEST-A');

do $$
begin
  if (select count(*) from public.flowguard_privacy_requests
      where requester_id = auth.uid() and details = 'TEST-REQUEST-A') <> 1 then
    raise exception 'Privacy request access failure: requester cannot read own request';
  end if;

  begin
    insert into public.flowguard_privacy_requests
      (requester_id, request_type, details)
    values ('EMPLOYEE_B_UUID', 'deletion', 'TEST-SPOOFED-REQUEST');
    raise exception 'Privacy request isolation failure: requester spoofed another account';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.flowguard_privacy_requests
    set status = 'completed'
    where details = 'TEST-REQUEST-A';
    raise exception 'Privacy request access failure: requester changed operator status';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.flowguard_privacy_requests
    where details = 'TEST-REQUEST-A';
    raise exception 'Privacy request access failure: requester deleted request history';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

select set_config('request.jwt.claim.sub', 'EMPLOYEE_B_UUID', true);
do $$
begin
  if exists (
    select 1 from public.flowguard_privacy_requests
    where requester_id = 'EMPLOYEE_A_UUID'
      and details = 'TEST-REQUEST-A'
  ) then
    raise exception 'Privacy request isolation failure: employee B can read employee A request';
  end if;

  begin
    insert into public.flowguard_privacy_requests
      (requester_id, request_type, details)
    values ('EMPLOYEE_A_UUID', 'deletion', 'TEST-SPOOFED-REQUEST-B');
    raise exception 'Privacy request isolation failure: employee B spoofed employee A';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

select set_config('request.jwt.claim.sub', 'MANAGER_UUID', true);
do $$
begin
  if exists (
    select 1 from public.flowguard_privacy_requests
    where requester_id = 'EMPLOYEE_A_UUID'
      and details = 'TEST-REQUEST-A'
  ) then
    raise exception 'Privacy request isolation failure: workspace manager can read employee request';
  end if;
end
$$;

rollback;
