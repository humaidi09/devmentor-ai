-- Reuse legacy notifications/reminders; only in-app delivery is enabled.
create table public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 in_app_enabled boolean not null default false, preview_details boolean not null default false,
 support_enabled boolean not null default true, academic_enabled boolean not null default true,
 cp_enabled boolean not null default true, developer_enabled boolean not null default true,
 quiet_hours_enabled boolean not null default false
);
alter table public.notification_preferences enable row level security;
create policy own_preferences on public.notification_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.notification_preferences from anon,authenticated;
grant select,insert,update,delete on public.notification_preferences to authenticated;
create function public.close_ai_notification_consent() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' or old.in_app_enabled is distinct from new.in_app_enabled then
  insert into public.consent_records(user_id,consent_type,granted) values(new.user_id,'notifications',new.in_app_enabled);
 end if;return new;
end;$$;
revoke all on function public.close_ai_notification_consent() from public;
create trigger notification_consent after insert or update on public.notification_preferences for each row execute function public.close_ai_notification_consent();
alter table public.reminders alter column action_step_id drop not null;
alter table public.reminders add column module text not null default 'support' check(module in ('support','academic','cp','developer')),
 add column recurrence text not null default 'once' check(recurrence in ('once','daily','weekly')),
 add column timezone text not null default 'UTC', add column last_delivered_for timestamptz,
 add column deadline_id uuid;
alter table public.deadlines add constraint deadlines_id_user_unique unique(id,user_id);
alter table public.reminders add constraint reminder_deadline_owner foreign key(deadline_id,user_id) references public.deadlines(id,user_id) on delete cascade;
alter table public.reminders add constraint reminder_source_scope check((action_step_id is null or module='support') and (deadline_id is null or module='academic'));
create function public.close_ai_timezone_guard() returns trigger language plpgsql set search_path='' as $$
begin if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone' using errcode='22023';end if;return new;end;$$;
revoke all on function public.close_ai_timezone_guard() from public;
create trigger reminder_timezone before insert or update on public.reminders for each row execute function public.close_ai_timezone_guard();
create trigger profile_timezone before insert or update on public.profiles for each row execute function public.close_ai_timezone_guard();
alter table public.notifications add column action_url text check(action_url in ('/support/steps','/study','/cp','/learn')),
 add column expires_at timestamptz, add column occurrence_key text;
create unique index close_ai_notification_occurrence on public.notifications(user_id,occurrence_key) where occurrence_key is not null;
revoke all on public.notifications from anon,authenticated;
grant select,delete on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
-- Existing own-row RLS policies remain in force. Content creation is scheduler-only.
create function public.close_ai_next_reminder(scheduled timestamptz, cadence text, zone text, as_of timestamptz) returns timestamptz language plpgsql immutable set search_path='' as $$
declare days integer:=case cadence when 'daily' then 1 when 'weekly' then 7 else 0 end; cycles integer; candidate timestamptz;
begin
 if days=0 then return null;end if;
 cycles:=greatest(1,floor(extract(epoch from ((as_of at time zone zone)-(scheduled at time zone zone)))/(86400*days))::integer+1);
 candidate:=((scheduled at time zone zone)+make_interval(days=>cycles*days)) at time zone zone;
 if candidate<=as_of then candidate:=((scheduled at time zone zone)+make_interval(days=>(cycles+1)*days)) at time zone zone;end if;return candidate;
end;$$;
revoke all on function public.close_ai_next_reminder(timestamptz,text,text,timestamptz) from public;
grant execute on function public.close_ai_next_reminder(timestamptz,text,text,timestamptz) to authenticated;
-- No caller-supplied actor or clock. Transactional, bounded, quiet-hour-aware delivery.
create function public.deliver_close_ai_reminders() returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); p public.profiles; prefs public.notification_preferences; r public.reminders; local_time time; target text; next_due timestamptz; delivered integer:=0; instant timestamptz:=now();
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
 select * into p from public.profiles where id=actor;
 if p.id is null then return 0;end if;
 select * into prefs from public.notification_preferences where user_id=actor;
 if prefs.in_app_enabled is distinct from true or not exists(select 1 from public.modules_enabled where user_id=actor and reminders_enabled) then return 0;end if;
 local_time:=(instant at time zone p.timezone)::time;
 if prefs.quiet_hours_enabled and p.quiet_hours_start is not null and p.quiet_hours_end is not null and
 (p.quiet_hours_start=p.quiet_hours_end or (p.quiet_hours_start<p.quiet_hours_end and local_time>=p.quiet_hours_start and local_time<p.quiet_hours_end) or (p.quiet_hours_start>p.quiet_hours_end and (local_time>=p.quiet_hours_start or local_time<p.quiet_hours_end))) then return 0;end if;
 for r in select * from public.reminders where user_id=actor and enabled and scheduled_for<=instant and (last_delivered_for is null or last_delivered_for<>scheduled_for)
 and exists(select 1 from public.modules_enabled m where m.user_id=actor and case module when 'support' then m.student_support_enabled when 'academic' then m.academic_study_enabled when 'cp' then m.cp_coach_enabled else m.developer_path_enabled end)
 and case module when 'support' then prefs.support_enabled when 'academic' then prefs.academic_enabled when 'cp' then prefs.cp_enabled else prefs.developer_enabled end
 order by scheduled_for limit 20 for update skip locked loop
  if (r.action_step_id is not null and not exists(select 1 from public.action_steps where id=r.action_step_id and user_id=actor and status not in ('completed','not_relevant')))
  or (r.deadline_id is not null and not exists(select 1 from public.deadlines where id=r.deadline_id and user_id=actor and status not in ('completed','cancelled'))) then update public.reminders set enabled=false where id=r.id;continue;end if;
  target:=case r.module when 'support' then '/support/steps' when 'academic' then '/study' when 'cp' then '/cp' else '/learn' end;
  insert into public.notifications(user_id,type,title,body,channel,scheduled_at,sent_at,status,action_url,expires_at,occurrence_key)
  values(actor,r.module||'_reminder','You have a Close AI reminder.',case when r.module<>'support' and prefs.preview_details then left(r.title,200) else 'Open Close AI to review it.' end,'in_app',r.scheduled_for,instant,'sent',target,instant+interval '30 days',r.id::text||':'||r.scheduled_for::text)
  on conflict(user_id,occurrence_key) where occurrence_key is not null do nothing;
  next_due:=public.close_ai_next_reminder(r.scheduled_for,r.recurrence,r.timezone,instant);
  update public.reminders set last_delivered_for=r.scheduled_for,scheduled_for=coalesce(next_due,r.scheduled_for),enabled=next_due is not null where id=r.id and user_id=actor;
  delivered:=delivered+1;
 end loop;
 return delivered;
end;$$;
revoke all on function public.deliver_close_ai_reminders() from public;
grant execute on function public.deliver_close_ai_reminders() to authenticated;
-- Preference + existing profile times/timezone save in one user-owned transaction.
create function public.save_close_ai_notifications(settings jsonb) returns void language plpgsql set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 insert into public.notification_preferences(user_id,in_app_enabled,preview_details,support_enabled,academic_enabled,cp_enabled,developer_enabled,quiet_hours_enabled)
 values(auth.uid(),(settings->>'inApp')::boolean,(settings->>'previews')::boolean,(settings->>'support')::boolean,(settings->>'academic')::boolean,(settings->>'cp')::boolean,(settings->>'developer')::boolean,(settings->>'quiet')::boolean)
 on conflict(user_id) do update set in_app_enabled=excluded.in_app_enabled,preview_details=excluded.preview_details,support_enabled=excluded.support_enabled,academic_enabled=excluded.academic_enabled,cp_enabled=excluded.cp_enabled,developer_enabled=excluded.developer_enabled,quiet_hours_enabled=excluded.quiet_hours_enabled;
 update public.profiles set timezone=settings->>'timezone',quiet_hours_start=(settings->>'start')::time,quiet_hours_end=(settings->>'end')::time where id=auth.uid();
end;$$;
revoke all on function public.save_close_ai_notifications(jsonb) from public;
grant execute on function public.save_close_ai_notifications(jsonb) to authenticated;
alter table public.reminders add column approval_token uuid;
create unique index close_ai_reminder_approval on public.reminders(user_id,approval_token) where approval_token is not null;
create function public.schedule_close_ai_reminder(settings jsonb, token uuid, confirmed boolean) returns uuid language plpgsql set search_path='' as $$
declare actor uuid:=auth.uid(); zone text; local_start timestamp; instant timestamptz; reminder uuid; step uuid:=nullif(settings->>'stepId','')::uuid;
begin
 if actor is null or confirmed is distinct from true or token is null then raise exception 'Approval required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||token::text,1));
 select id into reminder from public.reminders where user_id=actor and approval_token=token;
 if reminder is not null then return reminder;end if;
 select timezone into zone from public.profiles where id=actor;
 if zone is null then raise exception 'Profile required' using errcode='42501';end if;
 local_start:=(settings->>'local')::timestamp;instant:=local_start at time zone zone;
 if instant<=now() or instant>now()+interval '5 years' or (instant at time zone zone)<>local_start then raise exception 'Choose a future, valid local time' using errcode='22023';end if;
 if length(trim(settings->>'title')) not between 1 and 200 then raise exception 'Invalid title' using errcode='22023';end if;
 if step is not null then select id into reminder from public.reminders where user_id=actor and action_step_id=step;end if;
 if reminder is null then
  if (select count(*) from public.reminders where user_id=actor)>=100 then raise exception 'Reminder limit reached' using errcode='22023';end if;
  insert into public.reminders(user_id,title,module,recurrence,scheduled_for,timezone,enabled,action_step_id,deadline_id,approval_token)
  values(actor,trim(settings->>'title'),settings->>'module',settings->>'recurrence',instant,zone,true,step,nullif(settings->>'deadlineId','')::uuid,token) returning id into reminder;
 else
  update public.reminders set title=trim(settings->>'title'),module=settings->>'module',recurrence=settings->>'recurrence',scheduled_for=instant,timezone=zone,enabled=true,last_delivered_for=null,approval_token=token where id=reminder and user_id=actor;
 end if;return reminder;
end;$$;
revoke all on function public.schedule_close_ai_reminder(jsonb,uuid,boolean) from public;
grant execute on function public.schedule_close_ai_reminder(jsonb,uuid,boolean) to authenticated;
