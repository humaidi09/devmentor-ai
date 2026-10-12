# API and data-integrity fixes

Implementation: 2026-10-12. This document supersedes the implementation status in PROJECT_AUDIT.md, which records the original findings.

## Implemented

- Explicit demo/live separation; missing live configuration returns 503 instead of selecting memory storage. Legacy JWT secret is optional when auth is verified by Supabase. Transient auth outages are not reported as invalid credentials.
- Cron checks required configuration and accepts API_BASE_URL as a repository variable or secret. Unset/default cron secrets cannot authorize jobs.
- Replaced the retired default `gemini-2.0-flash` with `gemini-3.6-flash` in code, Render blueprint and environment examples. Google lists June 1, 2026 as the 2.0 Flash shutdown date and recommends 3.6 Flash: https://ai.google.dev/gemini-api/docs/deprecations . Existing Render environment overrides must also be updated; no authenticated provider request has been possible here.
- Provider initialization, quota, timeout, model/key, empty-response and network failures return actionable errors. Only explicit offline demo mode returns mock AI output. Requests have a provider time budget.
- Frontend signup waits for confirmation when no session is returned. Onboarding is guarded, reports errors instead of redirecting on failure, and marks completion only after preferences save. Invalid live Supabase clients do not authenticate users.
- API requests have a time limit, a slow-server notice, useful network errors, and central 401 handling. Settings failures no longer leave a permanent loading spinner. AI tools display provider errors.
- Atomic deletion includes private snippets, profile, audit, conversations and other app data. The auth account remains, as documented. There is no success-on-partial-delete behavior.
- Typed profile schedule/timezone validation, null checks, timestamp ordering validation, and the missing demo deadline status default.
- Plan generation stays within available slots, avoids existing tasks and CP overlap, reserves breaks, and is repeatable. Weekly replacement is implemented. Replacement preserves completed/in-progress work and is transactional in PostgreSQL; failed insertion rolls back deleted pending tasks. Per-user/day transaction locks serialize generation requests.
- Notification preferences are enforced at creation and delivery, pending notifications are not shown as delivered, and quiet hours use the saved notification preferences. Web push remains an explicitly unavailable optional feature and returns 501 rather than pretending subscription is functional.
- Focus pauses/breaks close active study segments, stop is idempotent, and errors remain visible. Recorded focus minutes feed analytics without double-counting linked completed tasks. Completion timestamps are separate from edit timestamps; zero actual minutes are preserved. CP dates use the user timezone.
- Saved conversations can be loaded/reopened after refresh. Conversation ownership is checked before generation; message pairs save in one database transaction. Suggested actions require a click and confirmation for writes. Snippet links open the actual snippet UI.
- Migrated Tailwind 3 to Tailwind 4.3 with its PostCSS plugin, updated tailwind-merge to v3, and replaced Next/ESLint tooling with Biome 2.5. This removes the unpatched braces dependency chain; a fresh full `npm audit` reports **zero vulnerabilities**. No advisory suppression or unverified override of braces was used. The existing theme configuration is retained and custom CSS uses cascade layers.
- Biome recommended rules now check React, accessibility, correctness and security. Buttons have explicit types; interactive backdrops are buttons; progress rings have accessible names; effect callbacks have stable dependencies. Index keys remain permitted for static/append-only presentational lists, matching the previous lint policy. Dependency checks still detect missing effect dependencies; intentionally reactive extra dependencies remain permitted.
- Python dependencies are locked; Render/CI use the lock. CI adds production build, browser smoke tests, and PostgreSQL migration/RLS/transaction checks.

## Verified locally

- 58 backend tests, including the new defect regressions.
- Frontend typecheck, lint and production build.
- Real Chromium: conversation send/history refresh/select, repeatable planning, focus start/pause/save, and 12 mobile routes without horizontal overflow or page errors.
- PostgreSQL 17: migrations 0001–0005, cross-user history denial, preserved other-user data, complete own-data deletion, immutable completion timestamps, unique generation keys, repeatable generation, and rollback after invalid replacement.
- Supabase's real auth service, the deployed schema, and real Gemini generation still require authenticated production verification. Local SQL tests use a minimal Supabase auth shim, not the full hosted Supabase stack.

## Required production sequence

1. **Apply `supabase/migrations/0005_data_integrity.sql` to the existing Supabase project before deploying the new API.** It adds the atomic deletion/chat/planner RPCs, generation index, and completion timestamp trigger. Never run `apps/api/tests/sql/bootstrap.sql` or the SQL tests against production; those are test fixtures only.
2. Render: keep `DEMO_MODE=false`, configure valid SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. SUPABASE_JWT_SECRET is optional for legacy local verification. Keep `API_CORS_ORIGINS=https://devmentor-ail.vercel.app` (comma-separated additional origins if needed); arbitrary Vercel origins are no longer trusted by default. Set `GEMINI_MODEL=gemini-3.6-flash` (or a model verified for your key); an existing `gemini-2.0-flash` override must be replaced. Set a non-default CRON_SECRET. Deploy the new API.
3. Vercel: build with `NEXT_PUBLIC_DEMO_MODE=false`, `NEXT_PUBLIC_API_BASE_URL=https://devmentor-api-dqrh.onrender.com`, and the existing valid public Supabase URL/anon key. Redeploy after changing public variables: they are build-time values.
4. GitHub repository Actions: set API_BASE_URL variable (or secret) to the Render URL. Set CRON_SECRET secret to the same value as Render. The connected GitHub integration returned HTTP 403 on variable writes, and no cron-secret value was available in this workspace. These settings remain pending; no credentials were invented or printed.
5. Check `/health` for liveness and `/ready` for database access. `/ready` does not prove Gemini access or check all migration objects. With a signed-in test user, verify onboarding, chat save/reload, plan generation and settings. Verify deletion using a disposable account only.
6. Check a real chat response and Render logs. If the provider returns a quota/key/model error, correct that provider setting. A health flag indicating a key exists is not proof that the configured model works.
7. Run each scheduled workflow manually after its configuration is complete. Check successful API results, not just a green deployment status.

## Remaining limits

- Render free-tier cold starts cannot be eliminated by changing frontend code. Slow-start feedback and bounded waiting are implemented; always-on hosting is an infrastructure choice.
- Tailwind 4 targets modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+). The tested browser here is Chromium; older browsers are outside this tooling baseline.
- No hosted Supabase/Render administration credentials are available here; the production migration, provider configuration and authenticated live checks cannot be performed from this workspace. GitHub repository settings also reject the current integration's write access.
- Web push is not implemented. Existing in-app delivery works; end-to-end email delivery requires configured provider credentials and an actual email notification producer.
- A focus session abandoned by closing the browser before saving is not included in totals. Pause/close the timer to persist it; automatic recovery of abandoned sessions is not implemented.

## Access recheck and handoff

- Rechecked GitHub access: repository code push is permitted, but Actions variables access returns HTTP 403 (Resource not accessible by integration). Code access does not grant repository settings access.
- Cloud runtime reports no configured app secrets or outbound identities. Saved secure requirements for SUPABASE_ACCESS_TOKEN (api.supabase.com), RENDER_API_KEY (api.render.com), and GEMINI_API_KEY (generativelanguage.googleapis.com) in the environment draft. Enter values through environment settings, never chat. Saving requirements does not supply credentials or apply the production migration.
- The completed fixes are published on a separate branch for review. Main must not be updated until the production migration is applied.
