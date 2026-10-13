-- MVP retrieval: invoker security preserves resource RLS; fixed filters precede relevance.
create function public.search_close_ai_resources(campus text, category text, search_text text default '') returns setof public.support_resources language sql stable set search_path='' as $$
 select r.* from public.support_resources r where r.campus_id=campus and (category is null or r.category_id=category)
 and r.verification_state='verified' and r.last_verified_at is not null and r.official_url like 'https://%'
 and (r.next_review_at is null or r.next_review_at>now()) and (r.time_sensitive_date is null or r.time_sensitive_date>now())
 order by ts_rank_cd(to_tsvector('simple',coalesce(r.name,'')||' '||coalesce(r.description,'')),plainto_tsquery('simple',left(search_text,2000))) desc,r.name limit 5;
$$;
revoke all on function public.search_close_ai_resources(text,text,text) from public;
grant execute on function public.search_close_ai_resources(text,text,text) to authenticated;
-- Fixed-window budgets; users can consume their own allowance, never reset it.
create table public.integration_usage(user_id uuid not null references auth.users(id) on delete cascade,service text not null check(service in ('ai','codeforces')),window_start timestamptz not null,requests integer not null,primary key(user_id,service));
alter table public.integration_usage enable row level security;
create policy own_usage on public.integration_usage for select to authenticated using(user_id=auth.uid());
revoke all on public.integration_usage from anon,authenticated;
grant select on public.integration_usage to authenticated;
create function public.consume_close_ai_budget(service_name text) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); n integer;
begin
 if actor is null or service_name not in ('ai','codeforces') then raise exception 'Not allowed' using errcode='42501';end if;
 insert into public.integration_usage(user_id,service,window_start,requests) values(actor,service_name,date_trunc('hour',now()),1)
 on conflict(user_id,service) do update set requests=case when integration_usage.window_start<date_trunc('hour',now()) then 1 else integration_usage.requests+1 end,window_start=date_trunc('hour',now()) returning requests into n;
 return n<=case when service_name='ai' then 20 else 30 end;
end;$$;
revoke all on function public.consume_close_ai_budget(text) from public;
grant execute on function public.consume_close_ai_budget(text) to authenticated;
alter table public.action_plans add column draft_token uuid;
create unique index close_ai_plan_draft_token on public.action_plans(user_id,draft_token) where draft_token is not null;
-- Explicit confirmation and transactional save prevent partial/duplicate plans on retry.
create function public.save_close_ai_draft(title text, resource text, steps jsonb, token uuid, confirmed boolean) returns uuid language plpgsql set search_path='' as $$
declare actor uuid:=auth.uid(); plan uuid; item jsonb; pos integer:=0;
begin
 if actor is null or confirmed is distinct from true then raise exception 'Approval required' using errcode='42501';end if;
 if length(trim(title)) not between 1 and 200 or jsonb_typeof(steps)<>'array' or jsonb_array_length(steps) not between 1 and 6 or token is null then raise exception 'Invalid draft' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||token::text,0));
 select id into plan from public.action_plans where user_id=actor and draft_token=token;
 if plan is not null then return plan;end if;
 if not exists(select 1 from public.support_resources where id=resource and verification_state='verified' and (next_review_at is null or next_review_at>now()) and (time_sensitive_date is null or time_sensitive_date>now())) then raise exception 'Resource needs verification' using errcode='22023';end if;
 insert into public.action_plans(user_id,title,related_resource_id,draft_token) values(actor,trim(title),resource,token) returning id into plan;
 for item in select value from jsonb_array_elements(steps) loop
  if jsonb_typeof(item)<>'string' or length(trim(item#>>'{}')) not between 1 and 200 then raise exception 'Invalid step' using errcode='22023';end if;
  insert into public.action_steps(user_id,action_plan_id,title,description,position) values(actor,plan,trim(item#>>'{}'),'AI suggestion, reviewed by student',pos);pos:=pos+1;
 end loop;return plan;
end;$$;
revoke all on function public.save_close_ai_draft(text,text,jsonb,uuid,boolean) from public;
grant execute on function public.save_close_ai_draft(text,text,jsonb,uuid,boolean) to authenticated;
