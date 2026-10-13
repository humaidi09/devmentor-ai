-- User-chosen external references only. Public metadata remains in provider caches.
create table public.saved_knowledge (
 user_id uuid not null references auth.users(id) on delete cascade,
 external_id text not null check(length(external_id) between 1 and 350),
 provider text not null check(provider in ('crossref','world-bank','github')),
 category text not null check(category in ('all','research','programming','economics','technology','competitive-programming','learning-resources')),
 title text not null check(length(title) between 1 and 300),
 url text not null check(length(url) between 1 and 2000),
 source text not null check(length(source) between 1 and 150),
 collection text not null default 'general' check(collection in ('general','study','developer','cp')),
 summary text not null default '',
 published_at text,
 retrieved_at timestamptz not null,
 saved_at timestamptz not null default now(),
 primary key(user_id,external_id)
);
create index saved_knowledge_recent on public.saved_knowledge(user_id,saved_at desc);
alter table public.saved_knowledge enable row level security;
create policy saved_knowledge_owner on public.saved_knowledge for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.saved_knowledge from anon,authenticated;
grant select,insert,update,delete on public.saved_knowledge to authenticated;

-- Reuse cp_manual_progress instead of duplicating each student's problem record.
alter table public.cp_manual_progress add column attempts integer not null default 0 check(attempts between 0 and 10000);
alter table public.cp_manual_progress add column first_attempt_at timestamptz;
alter table public.cp_manual_progress add column solved_at timestamptz;
alter table public.cp_manual_progress drop constraint cp_manual_progress_status_check;
alter table public.cp_manual_progress add constraint cp_manual_progress_status_check check(status in ('none','attempted','solved','skipped','need_hint','upsolve','upsolved'));

create or replace function public.erase_close_ai_data() returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); t text;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
 foreach t in array array['saved_knowledge','learning_progress','notification_preferences','learning_tasks','saved_resources','action_plans','reminders','consent_records','developer_path_progress','cp_manual_progress','deadlines','courses','cp_preferences','tasks','study_sessions','cp_recommendations','quiz_attempts','notifications','weekly_summaries','conversations','agent_audit_log'] loop
  execute format('delete from public.%I where user_id=$1',t) using actor;
 end loop;
 delete from public.snippets where owner_id=actor;
 delete from public.modules_enabled where user_id=actor;
 delete from public.profiles where id=actor;
 insert into public.profiles(id) values(actor);
 insert into public.modules_enabled(user_id) values(actor);
end;$$;
