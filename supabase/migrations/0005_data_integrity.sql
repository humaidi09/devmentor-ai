-- Atomic, authenticated deletion of app data; auth account remains available.
create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  delete from public.study_sessions where user_id = uid;
  delete from public.tasks where user_id = uid;
  delete from public.deadlines where user_id = uid;
  delete from public.courses where user_id = uid;
  delete from public.cp_preferences where user_id = uid;
  delete from public.cp_recommendations where user_id = uid;
  delete from public.snippets where owner_id = uid;
  delete from public.quiz_attempts where user_id = uid;
  delete from public.notifications where user_id = uid;
  delete from public.weekly_summaries where user_id = uid;
  delete from public.chat_messages where user_id = uid;
  delete from public.conversations where user_id = uid;
  delete from public.agent_audit_log where user_id = uid;
  delete from public.profiles where id = uid;
end;
$$;
revoke all on function public.delete_my_data() from public;
grant execute on function public.delete_my_data() to authenticated;

-- Only new generated rows have this key; old rows need no destructive cleanup.
create unique index if not exists tasks_generation_key_unique
on public.tasks(user_id, (metadata->>'generation_key'))
where metadata->>'generation_key' is not null;

alter table public.tasks add column if not exists completed_at timestamptz;
update public.tasks set completed_at = updated_at where status = 'completed' and completed_at is null;
create or replace function public.stamp_task_completion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists stamp_completion on public.tasks;
create trigger stamp_completion before insert or update on public.tasks
for each row execute function public.stamp_task_completion();

-- Commit both chat messages together and enforce conversation ownership.
create or replace function public.save_chat_turn(p_conversation uuid, p_message text,
  p_answer text, p_intent text, p_metadata jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid := p_conversation;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if cid is null then
    insert into public.conversations(user_id,title) values(uid,left(p_message,60)) returning id into cid;
  elsif not exists(select 1 from public.conversations where id=cid and user_id=uid) then
    raise exception 'Conversation not found';
  end if;
  insert into public.chat_messages(conversation_id,user_id,role,content,intent,metadata)
    values(cid,uid,'user',p_message,p_intent,'{}'),
          (cid,uid,'assistant',p_answer,p_intent,p_metadata);
  update public.conversations set updated_at=now() where id=cid and user_id=uid;
  return cid;
end;
$$;
revoke all on function public.save_chat_turn(uuid,text,text,text,jsonb) from public;
grant execute on function public.save_chat_turn(uuid,text,text,text,jsonb) to authenticated;

-- Serialize generation per user/day and replace pending generated work atomically.
create or replace function public.save_generated_plan(p_user uuid, p_day text,
  p_start timestamptz, p_end timestamptz, p_plans jsonb, p_replace boolean)
returns setof public.tasks language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if (auth.uid() is null or auth.uid() <> p_user) and current_user <> 'service_role' then
    raise exception 'Authentication required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_day, 0));
  if not p_replace and exists(select 1 from public.tasks where user_id=p_user and metadata->>'generated'='true'
    and (metadata->>'generated_date'=p_day or (scheduled_start>=p_start and scheduled_start<p_end))) then
    return query select * from public.tasks where user_id=p_user and metadata->>'generated'='true'
      and (metadata->>'generated_date'=p_day or (scheduled_start>=p_start and scheduled_start<p_end));
    return;
  end if;
  if p_replace then
    delete from public.tasks where user_id=p_user and status in ('pending','rescheduled')
      and metadata->>'generated'='true' and (metadata->>'generated_date'=p_day or (scheduled_start>=p_start and scheduled_start<p_end));
  end if;
  for item in select value from jsonb_array_elements(p_plans) loop
    return query insert into public.tasks(user_id,title,description,task_type,topic,deadline_id,
      scheduled_start,scheduled_end,estimated_minutes,priority,metadata,status)
    values(p_user,item->>'title',item->>'description',item->>'task_type',item->>'topic',
      (item->>'deadline_id')::uuid,(item->>'scheduled_start')::timestamptz,(item->>'scheduled_end')::timestamptz,
      (item->>'estimated_minutes')::integer,(item->>'priority')::integer,item->'metadata','pending') returning *;
  end loop;
end;
$$;
revoke all on function public.save_generated_plan(uuid,text,timestamptz,timestamptz,jsonb,boolean) from public;
grant execute on function public.save_generated_plan(uuid,text,timestamptz,timestamptz,jsonb,boolean) to authenticated, service_role;
