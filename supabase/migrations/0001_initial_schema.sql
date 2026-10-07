-- =====================================================================
-- DevMentor AI — 0001 initial schema
-- Postgres / Supabase. All timestamps are UTC (timestamptz).
-- Display conversion to the user's IANA timezone happens in the app.
-- =====================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- Shared updated_at trigger ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- profiles  (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id                         uuid primary key references auth.users(id) on delete cascade,
  display_name               text,
  preferred_language         text not null default 'en'
                               check (preferred_language in ('en','bn','bilingual')),
  timezone                   text not null default 'Asia/Dhaka',
  current_level              text not null default 'beginner'
                               check (current_level in ('beginner','intermediate','advanced')),
  weekly_study_goal_minutes  integer not null default 600 check (weekly_study_goal_minutes >= 0),
  available_schedule         jsonb not null default '{}'::jsonb,   -- { "mon": [{"start":"09:00","end":"11:00"}], ... }
  interests                  jsonb not null default '[]'::jsonb,
  goals                      jsonb not null default '[]'::jsonb,
  codeforces_handle          text,
  quiet_hours_start          time,
  quiet_hours_end            time,
  onboarding_completed       boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- =====================================================================
-- courses
-- =====================================================================
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  code        text,
  difficulty  text check (difficulty in ('easy','medium','hard')),
  color       text default '#6366f1',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists courses_user_idx on public.courses(user_id);

-- =====================================================================
-- deadlines
-- =====================================================================
create table if not exists public.deadlines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  title       text not null,
  type        text not null check (type in ('exam','assignment','quiz','project','interview')),
  due_at      timestamptz not null,
  priority    integer not null default 3 check (priority between 1 and 5),
  notes       text,
  status      text not null default 'pending'
                check (status in ('pending','completed','missed','cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists deadlines_user_due_idx on public.deadlines(user_id, due_at);

-- =====================================================================
-- tasks
-- =====================================================================
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  course_id         uuid references public.courses(id) on delete set null,
  deadline_id       uuid references public.deadlines(id) on delete set null,
  title             text not null,
  description       text,
  task_type         text not null default 'study'
                      check (task_type in ('study','cp','revision','quiz','project','focus','rest')),
  topic             text,
  scheduled_start   timestamptz,
  scheduled_end     timestamptz,
  estimated_minutes integer check (estimated_minutes >= 0),
  actual_minutes    integer check (actual_minutes >= 0),
  priority          integer not null default 3 check (priority between 1 and 5),
  status            text not null default 'pending'
                      check (status in ('pending','in_progress','completed','skipped','rescheduled')),
  completion_note   text,
  skip_reason       text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists tasks_user_start_idx on public.tasks(user_id, scheduled_start);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);

-- =====================================================================
-- study_sessions
-- =====================================================================
create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_minutes integer check (duration_minutes >= 0),
  focus_mode       boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists study_sessions_user_idx on public.study_sessions(user_id, started_at);

-- =====================================================================
-- cp_preferences  (1:1 with user)
-- =====================================================================
create table if not exists public.cp_preferences (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references auth.users(id) on delete cascade,
  morning_time              time not null default '10:00',
  evening_time              time not null default '20:00',
  problems_per_session      integer not null default 2 check (problems_per_session between 1 and 10),
  min_rating                integer not null default 800,
  max_rating                integer not null default 1200,
  preferred_tags            jsonb not null default '[]'::jsonb,
  weak_tags                 jsonb not null default '[]'::jsonb,
  notifications_enabled     boolean not null default true,
  contest_reminders_enabled boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (max_rating >= min_rating)
);

-- =====================================================================
-- cp_recommendations
-- =====================================================================
create table if not exists public.cp_recommendations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  recommendation_date date not null default ((now() at time zone 'utc')::date),
  session            text not null check (session in ('morning','evening','contest_upsolve')),
  contest_id         integer,
  problem_contest_id integer,
  problem_index      text,
  problem_name       text,
  problem_rating     integer,
  tags               jsonb not null default '[]'::jsonb,
  problem_url        text,
  status             text not null default 'suggested'
                       check (status in ('suggested','started','attempted','solved','skipped')),
  source_reason      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists cp_rec_user_date_idx on public.cp_recommendations(user_id, recommendation_date);
-- Avoid recommending the same problem to the same user twice.
create unique index if not exists cp_rec_unique_problem
  on public.cp_recommendations(user_id, problem_contest_id, problem_index)
  where problem_contest_id is not null;

-- =====================================================================
-- snippets  (owner_id NULL = built-in public library)
-- =====================================================================
create table if not exists public.snippets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,
  visibility  text not null default 'private' check (visibility in ('public','private')),
  title       text not null,
  description text,
  language    text not null,
  category    text not null,
  code        text not null,
  notes       text,
  tags        jsonb not null default '[]'::jsonb,
  usage_count integer not null default 0,
  search_tsv  tsvector,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Built-in snippets must be public; private snippets must have an owner.
  check ((owner_id is null and visibility = 'public') or (owner_id is not null))
);
create index if not exists snippets_language_idx on public.snippets(language);
create index if not exists snippets_category_idx on public.snippets(category);
create index if not exists snippets_owner_idx    on public.snippets(owner_id);
create index if not exists snippets_tags_idx     on public.snippets using gin(tags);

-- =====================================================================
-- quiz_attempts
-- =====================================================================
create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic      text,
  question   text,
  answer     text,
  correct    boolean,
  score      numeric,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_topic_idx on public.quiz_attempts(user_id, topic);

-- =====================================================================
-- notifications
-- =====================================================================
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  channel      text not null default 'in_app' check (channel in ('in_app','push','email')),
  scheduled_at timestamptz,
  sent_at      timestamptz,
  read_at      timestamptz,
  status       text not null default 'pending'
                 check (status in ('pending','scheduled','sent','failed','cancelled','read')),
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_due_idx
  on public.notifications(scheduled_at) where status in ('pending','scheduled');

-- =====================================================================
-- weekly_summaries
-- =====================================================================
create table if not exists public.weekly_summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  metrics    jsonb not null default '{}'::jsonb,
  insights   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- =====================================================================
-- conversations + chat_messages  (AI chat, used from Phase 2)
-- =====================================================================
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_idx on public.conversations(user_id, updated_at desc);

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  intent          text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists chat_messages_conv_idx on public.chat_messages(conversation_id, created_at);

-- =====================================================================
-- agent_audit_log  (orchestrator decisions + tool calls, no secrets)
-- =====================================================================
create table if not exists public.agent_audit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  intent          text,
  module          text,
  tool_calls      jsonb not null default '[]'::jsonb,
  decision_reason text,
  created_at      timestamptz not null default now()
);
create index if not exists agent_audit_user_idx on public.agent_audit_log(user_id, created_at desc);

-- =====================================================================
-- updated_at triggers
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','courses','deadlines','tasks','cp_preferences',
    'cp_recommendations','snippets','conversations'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;
