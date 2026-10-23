-- Synthetic browser users for disposable local PostgreSQL policy tests.
insert into auth.users (id,email,raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001','employee-a@example.invalid',
    '{"full_name":"Synthetic Employee A","username":"employee_a"}'),
  ('00000000-0000-0000-0000-000000000002','employee-b@example.invalid',
    '{"full_name":"Synthetic Employee B","username":"employee_b"}'),
  ('00000000-0000-0000-0000-000000000003','manager-a@example.invalid',
    '{"full_name":"Synthetic Manager A","username":"manager_a"}'),
  ('00000000-0000-0000-0000-000000000004','manager-b@example.invalid',
    '{"full_name":"Synthetic Manager B","username":"manager_b"}');
update public.profiles set role='manager'
where id in ('00000000-0000-0000-0000-000000000003',
             '00000000-0000-0000-0000-000000000004');
