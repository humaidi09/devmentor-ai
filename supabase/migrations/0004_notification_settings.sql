-- =====================================================================
-- DevMentor AI — 0004 notification settings on profiles
-- Stores per-user notification preferences and web-push tokens.
-- =====================================================================
alter table public.profiles
  add column if not exists notification_settings jsonb not null default '{}'::jsonb,
  add column if not exists push_tokens jsonb not null default '[]'::jsonb;
