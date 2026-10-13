alter table public.cp_preferences add column codeforces_connected_at timestamptz;
update public.cp_preferences set codeforces_handle=null where codeforces_handle is not null and codeforces_handle !~ '^[a-zA-Z0-9_.-]{3,24}$';
alter table public.cp_preferences add constraint close_ai_handle_format check(codeforces_handle is null or codeforces_handle ~ '^[a-zA-Z0-9_.-]{3,24}$');
alter table public.cp_preferences add constraint close_ai_connection_handle check(codeforces_connected_at is null or codeforces_handle is not null);
create function public.close_ai_codeforces_consent() returns trigger language plpgsql set search_path='' as $$
declare consent boolean;
begin
 if new.codeforces_connected_at is not null and (TG_OP='INSERT' or new.codeforces_handle is distinct from old.codeforces_handle or old.codeforces_connected_at is null) and auth.uid() is not null then
  select granted into consent from public.consent_records where user_id=auth.uid() and consent_type='optional_profile_data' order by created_at desc limit 1;
  if consent is distinct from true then raise exception 'Optional profile consent required' using errcode='42501';end if;
 end if;return new;
end;$$;
revoke all on function public.close_ai_codeforces_consent() from public;
create trigger codeforces_consent before insert or update on public.cp_preferences for each row execute function public.close_ai_codeforces_consent();
create function public.connect_close_ai_codeforces(handle text,confirmed boolean) returns void language plpgsql set search_path='' as $$
begin
 if auth.uid() is null or confirmed is distinct from true then raise exception 'Approval required' using errcode='42501';end if;
 insert into public.consent_records(user_id,consent_type,granted) values(auth.uid(),'optional_profile_data',true);
 insert into public.cp_preferences(user_id,codeforces_handle,codeforces_connected_at) values(auth.uid(),handle,now()) on conflict(user_id) do update set codeforces_handle=excluded.codeforces_handle,codeforces_connected_at=excluded.codeforces_connected_at;
end;$$;
revoke all on function public.connect_close_ai_codeforces(text,boolean) from public;
grant execute on function public.connect_close_ai_codeforces(text,boolean) to authenticated;
-- Explicit profile-consent withdrawal disconnects the optional service as well.
create function public.close_ai_optional_withdrawal() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.consent_type='optional_profile_data' and not new.granted then update public.cp_preferences set codeforces_handle=null,codeforces_connected_at=null where user_id=new.user_id;end if;
 if new.consent_type='notifications' and not new.granted then update public.notification_preferences set in_app_enabled=false where user_id=new.user_id and in_app_enabled;end if;
 return new;
end;$$;
revoke all on function public.close_ai_optional_withdrawal() from public;
create trigger optional_withdrawal after insert on public.consent_records for each row execute function public.close_ai_optional_withdrawal();
alter table public.cp_manual_progress drop constraint cp_manual_progress_status_check;
alter table public.cp_manual_progress add constraint cp_manual_progress_status_check check(status in ('none','attempted','solved','skipped','need_hint','upsolved'));
create table public.learning_progress (
 user_id uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in ('visual','project')),
 topic_key text not null check(length(topic_key) between 1 and 100),status text not null check(status in ('viewed','planned','started','in_progress','completed','paused')),
 position integer not null default 0 check(position between 0 and 1000),
 updated_at timestamptz not null default now(),primary key(user_id,kind,topic_key),
 check((kind='visual' and status in ('viewed','completed')) or (kind='project' and status<>'viewed'))
);
alter table public.learning_progress enable row level security;
create policy own_learning_progress on public.learning_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.learning_progress from anon,authenticated;
grant select,insert,update,delete on public.learning_progress to authenticated;
create trigger set_updated_at before update on public.learning_progress for each row execute function public.set_updated_at();
-- Extend the existing student-controlled reset; operations usage counters contain no content.
create or replace function public.erase_close_ai_data() returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); t text;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
 foreach t in array array['learning_progress','notification_preferences','learning_tasks','saved_resources','action_plans','reminders','consent_records','developer_path_progress','cp_manual_progress','deadlines','courses','cp_preferences','tasks','study_sessions','cp_recommendations','quiz_attempts','notifications','weekly_summaries','conversations','agent_audit_log'] loop
  execute format('delete from public.%I where user_id=$1',t) using actor;
 end loop;
 delete from public.snippets where owner_id=actor;
 delete from public.modules_enabled where user_id=actor;
 delete from public.profiles where id=actor;
 insert into public.profiles(id) values(actor);
 insert into public.modules_enabled(user_id) values(actor);
end;$$;
alter table public.learning_tasks add column planned_for timestamptz;
