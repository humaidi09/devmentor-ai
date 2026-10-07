# Supabase setup

Apply these in order in the **SQL Editor** (or with `psql "$DATABASE_URL" -f <file>`):

1. `migrations/0001_initial_schema.sql` — tables + updated_at triggers
2. `migrations/0002_rls_policies.sql` — Row Level Security
3. `migrations/0003_snippet_search.sql` — snippet full-text search
4. `migrations/0004_notification_settings.sql` — notification settings columns
5. `seed.sql` — 60 built-in public snippets (owner_id NULL)

Then grab, from **Project Settings → API**:
- Project URL → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)
- JWT Secret → `SUPABASE_JWT_SECRET`

Enable **Email** auth under Authentication → Providers.

## Notes
- A `profiles` row is created by the API on first `GET /api/me`. If you prefer a
  DB trigger on `auth.users` insert, you can add one, but it isn't required.
- `seed.sql` is idempotent: it deletes existing `owner_id IS NULL` snippets and
  re-inserts, so you can re-run it to refresh the built-in library.
- RLS is enforced for all normal access. Only the service_role key (used by the
  cron endpoints) bypasses it — never expose it to the browser.

## Local Supabase (optional)
With the Supabase CLI you can run `supabase start` and apply the same files;
point the apps at the local URL/keys the CLI prints.
