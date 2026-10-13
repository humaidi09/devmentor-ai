-- Atomic ordering, consent enforcement/audit and user-controlled app-data reset.
create function public.close_ai_consent_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.reminders_enabled is distinct from new.reminders_enabled then
  insert into public.consent_records(user_id,consent_type,granted) values(new.user_id,'reminders',new.reminders_enabled);
  if not new.reminders_enabled then update public.reminders set enabled=false where user_id=new.user_id; end if;
 end if;
 return new;
end; $$;
revoke all on function public.close_ai_consent_audit() from public;
create trigger consent_audit after update on public.modules_enabled for each row execute function public.close_ai_consent_audit();
-- Replace the first version: consent is now audited for *all* writes, including direct REST.
create or replace function public.save_close_ai_preferences(settings jsonb) returns void language plpgsql set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.modules_enabled set student_support_enabled=(settings->>'support')::boolean, academic_study_enabled=(settings->>'academic')::boolean,
 developer_path_enabled=(settings->>'developer')::boolean,cp_coach_enabled=(settings->>'cp')::boolean,reminders_enabled=(settings->>'reminders')::boolean where user_id=auth.uid();
 update public.profiles set campus_id=nullif(settings->>'campus',''),quiet_hours_start=(settings->>'quietStart')::time,quiet_hours_end=(settings->>'quietEnd')::time,onboarding_completed=(settings->>'onboarded')::boolean where id=auth.uid();
end; $$;
create function public.close_ai_storage_guard() returns trigger language plpgsql set search_path='' as $$
declare granted boolean;
begin
 if auth.uid() is not null then
  select c.granted into granted from public.consent_records c where c.user_id=auth.uid() and consent_type='support_data_storage' order by created_at desc limit 1;
  if granted is distinct from true then raise exception 'Storage consent required' using errcode='42501'; end if;
 end if;
 return new;
end; $$;
create trigger saved_consent before insert on public.saved_resources for each row execute function public.close_ai_storage_guard();
create trigger plans_consent before insert on public.action_plans for each row execute function public.close_ai_storage_guard();
create trigger steps_consent before insert on public.action_steps for each row execute function public.close_ai_storage_guard();
create function public.close_ai_reminder_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.enabled and not exists(select 1 from public.modules_enabled where user_id=new.user_id and reminders_enabled) then raise exception 'Reminder consent required' using errcode='42501'; end if;
 return new;
end; $$;
create trigger reminder_consent before insert or update on public.reminders for each row execute function public.close_ai_reminder_guard();
-- Validate ownership and the entire permutation before a transactional reorder.
create function public.reorder_close_ai_steps(plan uuid, ordered uuid[]) returns void language plpgsql set search_path='' as $$
declare item uuid; sort_position integer:=0;
begin
 perform 1 from public.action_plans where id=plan and user_id=auth.uid() for update;
 if not found then raise exception 'Plan not found' using errcode='42501'; end if;
 if cardinality(ordered)<>(select count(*) from public.action_steps where action_plan_id=plan and user_id=auth.uid()) or cardinality(ordered)<>(select count(distinct x) from unnest(ordered) x)
 or exists(select 1 from unnest(ordered) x where not exists(select 1 from public.action_steps where id=x and action_plan_id=plan and user_id=auth.uid())) then raise exception 'Invalid ordering' using errcode='22023'; end if;
 foreach item in array ordered loop update public.action_steps set position=sort_position where id=item and user_id=auth.uid();sort_position:=sort_position+1;end loop;
end; $$;
revoke all on function public.reorder_close_ai_steps(uuid,uuid[]) from public;
grant execute on function public.reorder_close_ai_steps(uuid,uuid[]) to authenticated;
create function public.erase_close_ai_data() returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); t text;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 foreach t in array array['learning_tasks','saved_resources','action_plans','consent_records','developer_path_progress','cp_manual_progress','deadlines','courses','cp_preferences','tasks','study_sessions','cp_recommendations','quiz_attempts','notifications','weekly_summaries','conversations','agent_audit_log'] loop
  execute format('delete from public.%I where user_id=$1',t) using actor;
 end loop;
 delete from public.snippets where owner_id=actor;
 delete from public.modules_enabled where user_id=actor;
 delete from public.profiles where id=actor;
 insert into public.profiles(id) values(actor);
 insert into public.modules_enabled(user_id) values(actor);
end; $$;
revoke all on function public.erase_close_ai_data() from public;
grant execute on function public.erase_close_ai_data() to authenticated;
-- Evidence records must not be re-parented to bypass the verified-resource downgrade.
create function public.close_ai_source_scope() returns trigger language plpgsql set search_path='' as $$
begin if new.resource_id<>old.resource_id then raise exception 'Source scope is immutable' using errcode='42501';end if;return new;end; $$;
create trigger source_scope before update on public.resource_sources for each row execute function public.close_ai_source_scope();
create table public.learning_tasks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), completed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.learning_tasks enable row level security;
create policy own_rows on public.learning_tasks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.learning_tasks to authenticated;
create trigger set_updated_at before update on public.learning_tasks for each row execute function public.set_updated_at();

create function public.close_ai_consent_timestamp() returns trigger language plpgsql set search_path='' as $$
begin new.created_at:=clock_timestamp(); new.version:='phase3-v1'; return new; end; $$;
create trigger consent_timestamp before insert on public.consent_records for each row execute function public.close_ai_consent_timestamp();
-- Optional display names require an explicit consent event, including direct REST writes.
create function public.close_ai_profile_consent() returns trigger language plpgsql set search_path='' as $$
declare consent boolean;
begin
 if auth.uid() is not null and nullif(trim(new.display_name),'') is not null and new.display_name is distinct from old.display_name then
  select granted into consent from public.consent_records where user_id=auth.uid() and consent_type='optional_profile_data' order by created_at desc limit 1;
  if consent is distinct from true then raise exception 'Optional profile consent required' using errcode='42501';end if;
 end if;
 return new;
end; $$;
create trigger optional_profile_consent before update on public.profiles for each row execute function public.close_ai_profile_consent();
