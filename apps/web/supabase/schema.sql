-- Close AI — database schema (run once in Supabase → SQL Editor).
-- Tables are prefixed ca_ to avoid clashing with anything already in the project.
-- Row Level Security ensures each student only ever sees their own rows.

-- Saved resources (one row per user per saved resource) ------------------------
create table if not exists public.ca_saved_resources (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  resource_id text        not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, resource_id)
);
alter table public.ca_saved_resources enable row level security;

drop policy if exists "ca_saved select own" on public.ca_saved_resources;
drop policy if exists "ca_saved insert own" on public.ca_saved_resources;
drop policy if exists "ca_saved delete own" on public.ca_saved_resources;
create policy "ca_saved select own" on public.ca_saved_resources for select using (auth.uid() = user_id);
create policy "ca_saved insert own" on public.ca_saved_resources for insert with check (auth.uid() = user_id);
create policy "ca_saved delete own" on public.ca_saved_resources for delete using (auth.uid() = user_id);

-- Action steps / "My Next Steps" ----------------------------------------------
create table if not exists public.ca_action_steps (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  detail      text,
  status      text        not null default 'not_started',
  source      text        not null default 'ai_suggestion',
  resource_id text,
  position    int         not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.ca_action_steps enable row level security;

drop policy if exists "ca_steps all own" on public.ca_action_steps;
create policy "ca_steps all own" on public.ca_action_steps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preferences (language / module toggles / consent) ---------------------------
create table if not exists public.ca_prefs (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  language   text        default 'en',
  modules    jsonb       default '{}'::jsonb,
  consent    jsonb       default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ca_prefs enable row level security;

drop policy if exists "ca_prefs all own" on public.ca_prefs;
create policy "ca_prefs all own" on public.ca_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
