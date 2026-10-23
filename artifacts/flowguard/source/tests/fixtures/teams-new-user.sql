-- This user signed up AFTER the first team migration: rerunning must not
-- automatically add them to the initial team.
insert into auth.users(id,email,raw_user_meta_data)
values('00000000-0000-0000-0000-000000000005','new-member@example.invalid',
  '{"full_name":"New Synthetic Employee","username":"new_employee"}');
