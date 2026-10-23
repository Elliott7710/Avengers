-- Existing synthetic records for the migration upgrade rehearsal.
begin;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
insert into public.flowguard_travel_records(id,owner_id,record_id,data)
values('30000000-0000-0000-0000-000000000001',auth.uid(),'BEFORE-TEAMS',
  '{"traveller":"Synthetic Employee","destination":"Demo City","start":"2026-11-02","end":"2026-11-04","cost":100,"purpose":"Upgrade rehearsal","status":"Requested"}');
insert into public.flowguard_insight_records(owner_id,record_id,data)
values(auth.uid(),'BEFORE-TEAMS','{"name":"Synthetic","value":1}');
commit;
