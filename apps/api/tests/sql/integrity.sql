\set ON_ERROR_STOP on
-- PostgREST's normal table privileges, with RLS enabled by the migrations.
grant select, insert, update, delete on all tables in schema public to authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
insert into public.profiles(id,display_name) values(auth.uid(),'User A');
insert into public.snippets(owner_id,title,language,category,code) values(auth.uid(),'Private A','python','Python','pass');
insert into public.tasks(user_id,title,metadata) values(auth.uid(),'Plan','{"generation_key":"test-key"}');
do $$ begin
  begin
    insert into public.tasks(user_id,title,metadata) values(auth.uid(),'Duplicate','{"generation_key":"test-key"}');
    raise exception 'Duplicate generation key was accepted';
  exception when unique_violation then null; end;
end $$;
update public.tasks set status='completed' where user_id=auth.uid();
do $$ declare stamp timestamptz; begin
  select completed_at into stamp from public.tasks where user_id=auth.uid();
  if stamp is null then raise exception 'No completion timestamp'; end if;
  update public.tasks set title='Renamed' where user_id=auth.uid();
  if (select completed_at from public.tasks where user_id=auth.uid()) <> stamp then raise exception 'Completion moved'; end if;
end $$;
select public.save_chat_turn(null,'Hello','Reply','chat_explain','{"mocked":true}') as cid \gset
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
insert into public.profiles(id,display_name) values(auth.uid(),'User B');
insert into public.snippets(owner_id,title,language,category,code) values(auth.uid(),'Private B','python','Python','pass');
select set_config('test.foreign_conversation', :'cid', false);
do $$ begin
  if exists(select 1 from public.chat_messages) then raise exception 'Leaked another user history'; end if;
  begin
    perform public.save_chat_turn(current_setting('test.foreign_conversation')::uuid,'Attack','Reply','chat_explain','{}');
    raise exception 'Cross-user conversation accepted';
  exception when raise_exception then
    if sqlerrm <> 'Conversation not found' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.delete_my_data();
reset role;
do $$ begin
  if exists(select 1 from public.snippets where owner_id='11111111-1111-1111-1111-111111111111') then raise exception 'Snippet survived deletion'; end if;
  if exists(select 1 from public.profiles where id='11111111-1111-1111-1111-111111111111') then raise exception 'Profile survived deletion'; end if;
  if exists(select 1 from public.chat_messages where user_id='11111111-1111-1111-1111-111111111111') then raise exception 'Chat survived deletion'; end if;
  if not exists(select 1 from public.snippets where owner_id='22222222-2222-2222-2222-222222222222') then raise exception 'Other user data deleted'; end if;
end $$;
