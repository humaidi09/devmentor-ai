-- Close AI Phase 3: additive schema; preserve existing DevMentor migrations.
create table public.campuses (
 id text primary key, name text not null, university_name text, city text, country text,
 status text not null default 'demo' check(status in ('demo','active','inactive')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles add column campus_id text references public.campuses(id) on delete set null;
alter table public.profiles alter column display_name set default '';
alter table public.profiles alter column quiet_hours_start set default '22:00';
alter table public.profiles alter column quiet_hours_end set default '08:00';
create table public.modules_enabled (
 user_id uuid primary key references auth.users(id) on delete cascade,
 student_support_enabled boolean not null default true,
 academic_study_enabled boolean not null default true,
 developer_path_enabled boolean not null default true,
 cp_coach_enabled boolean not null default true,
 reminders_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.support_categories (id text primary key, label text not null, label_bn text not null);
create table public.resource_roles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 campus_id text not null references public.campuses(id),
 role text not null check(role in ('resource_maintainer','resource_reviewer','admin')),
 unique(user_id,campus_id,role)
);
-- Roles can only be granted by a trusted database operator, never by profile metadata.
create function public.has_resource_role(campus text, allowed text[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.resource_roles where user_id=auth.uid() and campus_id=campus and role=any(allowed));
$$;
revoke all on function public.has_resource_role(text,text[]) from public;
grant execute on function public.has_resource_role(text,text[]) to anon, authenticated;
create table public.support_resources (
 id text primary key default gen_random_uuid()::text,
 campus_id text not null references public.campuses(id), category_id text not null references public.support_categories(id),
 name text not null check(length(name) between 1 and 200), description text not null default '' check(length(description)<=4000),
 eligibility_summary text not null default '', cost_summary text, location_summary text not null default '', contact_summary text,
 official_url text check(official_url is null or official_url ~ '^https://[^[:space:]]+$'),
 verification_state text not null default 'draft' check(verification_state in ('draft','needs_review','verified','unverified','expired','archived')),
 last_verified_at timestamptz, next_review_at timestamptz, time_sensitive_date timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 is_demo boolean not null default false
);
create index support_resources_campus_state_idx on public.support_resources(campus_id,verification_state);
create table public.resource_sources (
 id uuid primary key default gen_random_uuid(), resource_id text not null references public.support_resources(id) on delete cascade,
 source_url text not null check(source_url ~ '^https://[^[:space:]]+$'), source_title text not null,
 source_type text not null default 'official' check(source_type in ('official','demo')),
 checked_at timestamptz, created_at timestamptz not null default now()
);
create table public.resource_verification_events (
 id uuid primary key default gen_random_uuid(), resource_id text not null references public.support_resources(id) on delete cascade,
 reviewer_id uuid references auth.users(id) on delete set null, previous_state text, new_state text not null,
 note text not null default '', verified_at timestamptz, created_at timestamptz not null default now()
);
create table public.saved_resources (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 resource_id text not null references public.support_resources(id) on delete cascade,
 created_at timestamptz not null default now(), unique(user_id,resource_id)
);
create table public.action_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), description text not null default '',
 related_resource_id text references public.support_resources(id) on delete set null,
 status text not null default 'active' check(status in ('active','completed','dismissed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.action_steps (
 id uuid primary key default gen_random_uuid(), action_plan_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), description text not null default '',
 status text not null default 'not_started' check(status in ('not_started','in_progress','waiting','completed','not_relevant')),
 position integer not null default 0 check(position>=0), due_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(action_plan_id,user_id) references public.action_plans(id,user_id) on delete cascade,
 unique(id,user_id)
);
create index action_steps_plan_position_idx on public.action_steps(action_plan_id,position);
create table public.consent_records (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 consent_type text not null check(consent_type in ('optional_profile_data','reminders','support_data_storage','notifications')),
 granted boolean not null, version text not null default 'phase3-v1', created_at timestamptz not null default now()
);
create index consent_user_type_time_idx on public.consent_records(user_id,consent_type,created_at desc);
create table public.reminders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 action_step_id uuid not null, title text not null default 'Action step reminder', scheduled_for timestamptz,
 enabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(action_step_id,user_id) references public.action_steps(id,user_id) on delete cascade,
 unique(user_id,action_step_id)
);
create table public.developer_path_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 pathway text not null, milestone_key text not null, status text not null check(status in ('not_started','completed')),
 updated_at timestamptz not null default now(), unique(user_id,pathway,milestone_key)
);
alter table public.cp_preferences add column codeforces_handle text, add column reminders_enabled boolean not null default false;
alter table public.cp_preferences alter column notifications_enabled set default false;
alter table public.cp_preferences alter column contest_reminders_enabled set default false;
create table public.cp_manual_progress (
 user_id uuid not null references auth.users(id) on delete cascade, problem_key text not null,
 status text not null check(status in ('none','attempted','solved','skipped')),
 updated_at timestamptz not null default now(), primary key(user_id,problem_key)
);
-- Enforce ownership of course/deadline relationships, including direct REST requests.
alter table public.courses add constraint courses_id_user_unique unique(id,user_id);
alter table public.deadlines add constraint deadlines_course_owner_fk foreign key(course_id,user_id) references public.courses(id,user_id);

create function public.close_ai_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id) on conflict do nothing;
 insert into public.modules_enabled(user_id) values(new.id) on conflict do nothing;
 return new;
end; $$;
revoke all on function public.close_ai_new_user() from public;
create trigger close_ai_new_user after insert on auth.users for each row execute function public.close_ai_new_user();
insert into public.modules_enabled(user_id) select id from auth.users on conflict do nothing;
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create function public.close_ai_resource_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null then
  if TG_OP='INSERT' then
   if new.verification_state <> 'draft' or new.last_verified_at is not null then raise exception 'Draft required' using errcode='42501'; end if;
  else
   if new.last_verified_at is distinct from old.last_verified_at then raise exception 'Verification timestamp is managed by review' using errcode='42501'; end if;
   if new.campus_id<>old.campus_id or new.is_demo<>old.is_demo then raise exception 'Scope and demo marker are immutable' using errcode='42501'; end if;
   if (to_jsonb(new)-array['verification_state','last_verified_at','updated_at','archived_at']) is distinct from (to_jsonb(old)-array['verification_state','last_verified_at','updated_at','archived_at']) then
    if not public.has_resource_role(old.campus_id,array['resource_maintainer','admin']) then raise exception 'Editing not allowed' using errcode='42501'; end if;
    if old.verification_state='verified' then new.verification_state:='needs_review'; new.last_verified_at:=old.last_verified_at; end if;
   end if;
   if new.verification_state is distinct from old.verification_state and not public.has_resource_role(old.campus_id,array['resource_reviewer','admin']) and new.verification_state<>'needs_review' then
    raise exception 'Reviewer required' using errcode='42501';
   end if;
   if new.last_verified_at is distinct from old.last_verified_at and new.verification_state=old.verification_state then raise exception 'Review required' using errcode='42501'; end if;
  end if;
  if new.verification_state='verified' and (TG_OP='INSERT' or old.verification_state is distinct from new.verification_state) then
   if not exists(select 1 from public.resource_sources where resource_id=new.id and checked_at is not null) then raise exception 'Checked evidence required' using errcode='23514'; end if;
   if new.next_review_at is not null and new.next_review_at<=now() or new.time_sensitive_date is not null and new.time_sensitive_date<=now() then raise exception 'Resource is expired' using errcode='23514'; end if;
   new.last_verified_at:=now();
  end if;
 end if;
 if new.verification_state='archived' then new.archived_at:=now(); else new.archived_at:=null; end if;
 return new;
end; $$;
create trigger resource_guard before insert or update on public.support_resources for each row execute function public.close_ai_resource_guard();
create function public.close_ai_resource_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  insert into public.resource_verification_events(resource_id,reviewer_id,new_state,note,verified_at) values(new.id,auth.uid(),new.verification_state,'Created',new.last_verified_at);
 elsif old.verification_state is distinct from new.verification_state then
  insert into public.resource_verification_events(resource_id,reviewer_id,previous_state,new_state,note,verified_at)
  values(new.id,auth.uid(),old.verification_state,new.verification_state,coalesce(nullif(current_setting('close_ai.review_note',true),''),'State changed'),new.last_verified_at);
 end if;
 return new;
end; $$;
revoke all on function public.close_ai_resource_audit() from public;
create trigger resource_audit after insert or update on public.support_resources for each row execute function public.close_ai_resource_audit();
create function public.review_resource(resource text, state text, note text) returns void language plpgsql set search_path='' as $$
begin
 if length(trim(note)) not between 1 and 1000 or state not in ('verified','unverified','expired','archived','needs_review') then raise exception 'Invalid review' using errcode='22023'; end if;
 if not exists(select 1 from public.support_resources where id=resource and public.has_resource_role(campus_id,array['resource_reviewer','admin'])) then raise exception 'Reviewer required' using errcode='42501'; end if;
 perform set_config('close_ai.review_note',note,true);
 update public.support_resources set verification_state=state where id=resource;
end; $$;
revoke all on function public.review_resource(text,text,text) from public;
grant execute on function public.review_resource(text,text,text) to authenticated;
-- Changing evidence invalidates an existing verification; reviewer must re-check.
create function public.close_ai_source_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.support_resources set verification_state='needs_review' where id=coalesce(new.resource_id,old.resource_id) and verification_state='verified';
 return coalesce(new,old);
end; $$;
revoke all on function public.close_ai_source_changed() from public;
create trigger source_changed after insert or update or delete on public.resource_sources for each row execute function public.close_ai_source_changed();

-- Atomic preferences + consent audit; no implicit consent is inferred from defaults.
create function public.save_close_ai_preferences(settings jsonb) returns void language plpgsql set search_path='' as $$
declare previous boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select reminders_enabled into previous from public.modules_enabled where user_id=auth.uid() for update;
 update public.modules_enabled set student_support_enabled=(settings->>'support')::boolean, academic_study_enabled=(settings->>'academic')::boolean,
 developer_path_enabled=(settings->>'developer')::boolean,cp_coach_enabled=(settings->>'cp')::boolean,reminders_enabled=(settings->>'reminders')::boolean where user_id=auth.uid();
 update public.profiles set campus_id=nullif(settings->>'campus',''),quiet_hours_start=(settings->>'quietStart')::time,quiet_hours_end=(settings->>'quietEnd')::time,onboarding_completed=(settings->>'onboarded')::boolean where id=auth.uid();
 if previous is distinct from (settings->>'reminders')::boolean then
  insert into public.consent_records(user_id,consent_type,granted) values(auth.uid(),'reminders',(settings->>'reminders')::boolean);
 end if;
end; $$;
revoke all on function public.save_close_ai_preferences(jsonb) from public;
grant execute on function public.save_close_ai_preferences(jsonb) to authenticated;

-- Owner authorization. Staff resource roles never widen these policies.
do $$ declare t text; begin
 foreach t in array array['modules_enabled','saved_resources','action_plans','action_steps','reminders','developer_path_progress','cp_manual_progress'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy own_rows on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
 foreach t in array array['campuses','support_categories','support_resources','resource_sources','resource_verification_events','resource_roles','consent_records'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
 foreach t in array array['campuses','support_resources','action_plans','action_steps','reminders','developer_path_progress','cp_manual_progress','modules_enabled'] loop
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;
create policy campuses_read on public.campuses for select to anon,authenticated using(status in ('demo','active'));
create policy categories_read on public.support_categories for select to anon,authenticated using(true);
create policy roles_read_own on public.resource_roles for select to authenticated using(user_id=auth.uid());
-- Students can inspect uncertain/expired/archived records with explicit labels, never drafts/internal notes.
create policy resources_read on public.support_resources for select to anon,authenticated using(
 (verification_state<>'draft' and (verification_state<>'needs_review' or last_verified_at is not null) and exists(select 1 from public.campuses where id=campus_id and status in ('demo','active')))
 or public.has_resource_role(campus_id,array['resource_maintainer','resource_reviewer','admin'])
);
create policy resource_create on public.support_resources for insert to authenticated with check(public.has_resource_role(campus_id,array['resource_maintainer','admin']));
create policy resource_edit on public.support_resources for update to authenticated using(public.has_resource_role(campus_id,array['resource_maintainer','resource_reviewer','admin'])) with check(public.has_resource_role(campus_id,array['resource_maintainer','resource_reviewer','admin']));
create policy sources_read on public.resource_sources for select to anon,authenticated using(exists(select 1 from public.support_resources where id=resource_id));
create policy sources_manage on public.resource_sources for all to authenticated using(exists(select 1 from public.support_resources where id=resource_id and public.has_resource_role(campus_id,array['resource_maintainer','admin']))) with check(exists(select 1 from public.support_resources where id=resource_id and public.has_resource_role(campus_id,array['resource_maintainer','admin'])));
create policy events_staff_read on public.resource_verification_events for select to authenticated using(exists(select 1 from public.support_resources where id=resource_id and public.has_resource_role(campus_id,array['resource_maintainer','resource_reviewer','admin'])));
create policy consent_read on public.consent_records for select to authenticated using(user_id=auth.uid());
create policy consent_append on public.consent_records for insert to authenticated with check(user_id=auth.uid());
grant select on public.campuses,public.support_categories,public.support_resources,public.resource_sources to anon,authenticated;
grant select on public.resource_roles,public.resource_verification_events,public.consent_records to authenticated;
grant insert on public.consent_records to authenticated;
grant insert,update on public.support_resources to authenticated;
grant insert,update,delete on public.resource_sources to authenticated;
-- Saved references must point to a student-visible resource, even through direct REST writes.
create function public.close_ai_saved_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.support_resources where id=new.resource_id and verification_state<>'draft' and (verification_state<>'needs_review' or last_verified_at is not null)) then raise exception 'Resource is not visible' using errcode='42501'; end if;
 return new;
end; $$;
create trigger saved_guard before insert or update on public.saved_resources for each row execute function public.close_ai_saved_guard();
-- Legacy tables are not used by Close AI. Remove public access rather than exposing unused old relationships.
revoke all on public.tasks,public.study_sessions,public.cp_recommendations,public.snippets,public.quiz_attempts,public.notifications,public.weekly_summaries,public.conversations,public.chat_messages,public.agent_audit_log from anon,authenticated;
-- Never let an untrusted client change role grants or append fabricated review events.
revoke insert,update,delete on public.resource_roles,public.resource_verification_events from anon,authenticated;
