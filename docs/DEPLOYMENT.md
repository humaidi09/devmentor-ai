# Close AI deployment and recovery

The product is the Next.js application in `apps/web`. The older FastAPI service in `apps/api`, its Render configuration and cron workflows are retained for historical DevMentor use; Close AI does not call them. Do not copy legacy API service-role, cron, email or push settings into the Close AI website.

## Environments and release gate

| Environment | Data | Purpose |
| --- | --- | --- |
| Local demo | Fictional browser data | UI, offline and accessibility development without credentials. |
| Local account fixture | Disposable loopback PostgreSQL, GoTrue and PostgREST | Migrations, auth, RLS and regression tests. `bash supabase/test-stack.sh reset` destroys only this fixture. |
| Preview/staging | Dedicated non-production Supabase project | Email-confirmation, redirect, backup/restore and deployment smoke tests before pilot. |
| Limited pilot | Separate Supabase project and verified campus records | Only after [pre-launch gates](PRE_LAUNCH_CHECKLIST.md) and named human owners pass. |

Never use fictional seed records as actual campus support. The committed `supabase/seed-demo.sql` contains DEMO-labelled examples only. Do not run destructive tests or `db reset` on staging/pilot data.

## Database and Auth

1. Choose and document the intended Supabase project. For a legacy shared database, review `0005_close_ai_core.sql` first: it revokes older private-table client grants and adds owner constraints. Resolve conflicting historical rows before migration.
2. Take a provider-managed database backup and prove restore to a separate environment before a pilot migration. Record the backup time, operator and restore result; an untested backup is not a recovery claim.
3. Apply `supabase/migrations/0001` through `0009` in order with a linked Supabase CLI (`supabase db push`) or an authorized SQL operator. Inspect the migration plan and use a maintenance window. Never run `db reset` on hosted data.
4. Verify every public application table has RLS, sample two-user isolation and staff role boundaries against the target project. The local fixture passing does not establish hosted authorization.
5. Enable email/password Auth with email confirmation. Set the Auth Site URL and exact HTTPS `/auth/callback` redirect for each deployment. Test signup, confirmation, signin, signout, expiry and account switching on staging.
6. Create real campus records only after a maintainer and reviewer verify official source, contact, eligibility, cost, location, campus and last-checked date. Assign campus resource roles through a trusted SQL operator, never through student-facing settings.

## Vercel website configuration

Configure the project whose production alias serves the intended website. All `NEXT_PUBLIC_*` values are compiled into the build, so change them **before** redeploying. The Supabase project URL and anon/publishable key are public identifiers; they do not bypass RLS. Never add a service-role key to this app.

| Variable | Demo | Account staging/pilot |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | `false` |
| `NEXT_PUBLIC_ACCOUNT_MODE_ENABLED` | `false` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | empty | Target project HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | empty | Target public anon/publishable key |
| `CLOSE_AI_SITE_URL` | optional | Canonical HTTPS origin for that deployment |
| `AI_PROVIDER` | `mock` | `mock` until a tested provider is approved; optional `gemini` |
| `AI_MODEL` | optional | Tested model ID when using Gemini |
| `AI_API_KEY` or `GEMINI_API_KEY` | absent | Server-only, if Gemini is enabled |

An account build requires **both** account flags and both public Supabase values. Preview and pilot deployments need their own canonical origin and allowed Auth redirects. `CLOSE_AI_SITE_URL` must match the browser origin; it protects same-origin mutations and redirects. Gemini is optional; mock and manual resource browsing remain usable on provider failure. Codeforces needs no key. In-app reminders only check while a signed-in app is open; no email, push or remote scheduler is configured.

## Release smoke checks

After deployment, request `/api/status` and record `mode`, `supabaseConfigured` and commit `revision`. This endpoint reports configuration presence, not a successful database connection. Verify the deployed Git revision, homepage, `/support/resources`, `/support/human`, `/learn/visual-lab/bfs` and small-screen navigation. In account mode, use two staging users to verify Auth, selected-campus resource filtering, save/unsave, approved plans, export/reset and cross-user denial. Check a current verified source and an expired/needs-review source. Confirm AI refusal/fallback and Codeforces disconnect. Inspect response security headers and private `Cache-Control` on account pages/API. Record actual outcomes in [TEST_REPORT.md](TEST_REPORT.md).

Current observed public website on 2026-10-13: `https://devmentor-ai-rho.vercel.app/api/status` reported `mode=demo`, `supabaseConfigured=false`, revision `951efe4`. It is a functioning fictional demo, not a configured account deployment. This environment's Supabase Management request returned HTTP 401 (`JWT could not be decoded`). The configured Vercel token authenticated as `humaidi09` but could not list the `hussain8` team (403) or access project `devmentor-ai` by slug (404). Hosted migrations, Auth settings and account variables were therefore not changed or verified.

## Backup, rollback and monitoring

Before pilot, the database owner must define backup cadence and retention for Auth users and all app tables, run and record a separate-project restore drill, and own accidental-deletion recovery. Do not restore a snapshot over live data without identifying the affected users and writes since that snapshot. A Vercel build can be rolled back to a previous verified deployment; schema rollback requires a reviewed migration or restore plan, not an assumed reversible `db push`.

Monitor anonymous uptime/status, aggregate 5xx rates and provider/integration failures without storing chat text, passwords, tokens or student profile fields. Set an escalation contact and response window before inviting pilot users. No external monitoring or recovery drill has been configured or tested yet.
