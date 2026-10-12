\set ON_ERROR_STOP on
insert into auth.users values ('33333333-3333-3333-3333-333333333333');
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
do $$ declare original uuid; count_rows integer;
  plan jsonb := '[{"title":"Planned","task_type":"study","scheduled_start":"2027-01-01T09:00:00Z","scheduled_end":"2027-01-01T10:00:00Z","estimated_minutes":60,"priority":3,"metadata":{"generated":true,"generated_date":"2027-01-01","generation_key":"atomic-key"}}]';
begin
  perform public.save_generated_plan(auth.uid(),'2027-01-01','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',plan,false);
  select id into original from public.tasks where user_id=auth.uid();
  perform public.save_generated_plan(auth.uid(),'2027-01-01','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',plan,false);
  select count(*) into count_rows from public.tasks where user_id=auth.uid();
  if count_rows <> 1 then raise exception 'Repeated generation duplicated rows'; end if;
  begin
    perform public.save_generated_plan(auth.uid(),'2027-01-01','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',jsonb_set(plan,'{0,title}','null'),true);
    raise exception 'Invalid plan accepted';
  exception when not_null_violation then null; end;
  if not exists(select 1 from public.tasks where id=original) then raise exception 'Failed replacement lost original plan'; end if;
end $$;
select public.delete_my_data();
reset role;
