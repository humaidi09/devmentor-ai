-- =====================================================================
-- DevMentor AI — 0002 Row Level Security
-- Principle: a user can only touch their own rows. Built-in public
-- snippets (owner_id IS NULL) are readable by any authenticated user.
-- The service_role key bypasses RLS and is used ONLY by cron jobs.
-- =====================================================================

-- Enable RLS everywhere -----------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.courses            enable row level security;
alter table public.deadlines          enable row level security;
alter table public.tasks              enable row level security;
alter table public.study_sessions     enable row level security;
alter table public.cp_preferences     enable row level security;
alter table public.cp_recommendations enable row level security;
alter table public.snippets           enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.notifications      enable row level security;
alter table public.weekly_summaries   enable row level security;
alter table public.conversations      enable row level security;
alter table public.chat_messages      enable row level security;
alter table public.agent_audit_log    enable row level security;

-- profiles (keyed on id) ----------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policies for user_id-keyed tables ---------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'courses','deadlines','tasks','study_sessions','cp_preferences',
    'cp_recommendations','quiz_attempts','notifications',
    'weekly_summaries','conversations','chat_messages'
  ] loop
    execute format('drop policy if exists %I_rw on public.%I;', t, t);
    execute format($f$
      create policy %1$I_rw on public.%1$I
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- snippets: read public OR own; write only own ------------------------------
drop policy if exists snippets_select on public.snippets;
create policy snippets_select on public.snippets
  for select using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists snippets_insert on public.snippets;
create policy snippets_insert on public.snippets
  for insert with check (owner_id = auth.uid());

drop policy if exists snippets_update on public.snippets;
create policy snippets_update on public.snippets
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists snippets_delete on public.snippets;
create policy snippets_delete on public.snippets
  for delete using (owner_id = auth.uid());

-- agent_audit_log: user may read + append their own rows (no update/delete) --
drop policy if exists audit_select on public.agent_audit_log;
create policy audit_select on public.agent_audit_log
  for select using (auth.uid() = user_id);
drop policy if exists audit_insert on public.agent_audit_log;
create policy audit_insert on public.agent_audit_log
  for insert with check (auth.uid() = user_id);
