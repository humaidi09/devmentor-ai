# Deployment

All services have free tiers. Target: **$0/month**.

## 0. Supabase (database + auth)
1. Create a project at supabase.com.
2. SQL editor → run in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_snippet_search.sql`
   - `supabase/migrations/0004_notification_settings.sql`
   - `supabase/seed.sql` (built-in public snippets)
3. Project Settings → API: copy **Project URL**, **anon key**, **service_role
   key**, and **JWT Secret**.
4. Authentication → providers: enable **Email**.

## 1. Backend → Render (free web service)
1. New → Web Service → connect the repo, root `apps/api`.
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment:
   ```
   DEMO_MODE=false
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_JWT_SECRET=...
   GEMINI_API_KEY=...            # optional
   GEMINI_MODEL=gemini-2.0-flash
   CRON_SECRET=<long-random>
   API_CORS_ORIGINS=https://<your-vercel-app>.vercel.app
   ```
5. Note the service URL, e.g. `https://devmentor-api.onrender.com`.

> Render free instances **sleep** after inactivity → first request cold-starts
> (~30–60s). See free-tier limitations.

## 2. Frontend → Vercel
1. New Project → import repo → root `apps/web`.
2. Environment:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_API_BASE_URL=https://devmentor-api.onrender.com
   NEXT_PUBLIC_DEMO_MODE=false
   ```
3. Deploy. Framework preset: Next.js (auto).

## 3. Scheduled jobs → GitHub Actions
Free hosts can't run an always-on worker, so cron is driven by Actions calling
idempotent endpoints.

Repo → Settings → Secrets and variables → Actions → add:
- `API_BASE_URL` = your Render URL
- `CRON_SECRET` = same value as the API

Workflows live in `.github/workflows/cron-*.yml` and also support manual
`workflow_dispatch`. Timing is approximate (see limitations); endpoints are
idempotent and timezone-aware so this is safe.

## 4. Email (optional) — Resend
Create a free Resend key → set `RESEND_API_KEY` and `EMAIL_FROM` on the API.
Without it, email notifications are logged, not sent; in-app always works.

## 5. Web push (optional) — Firebase
Add FCM config/server key later and wire the service worker. Until then the app
uses in-app notifications (+ optional email). This is a documented future
enhancement, not required for MVP.

## Smoke test
```bash
curl https://devmentor-api.onrender.com/health
# {"status":"ok","demo_mode":false,"supabase_configured":true,...}
```
Then sign up on the Vercel app, complete onboarding, and open the dashboard.
