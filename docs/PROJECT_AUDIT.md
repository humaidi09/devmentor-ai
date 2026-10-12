# DevMentor AI project audit

Date: 2026-10-11. Audited commit: `9b7aa15`. This is a diagnosis report; application code and production data were not changed. Destructive reproductions used an isolated local in-memory store only.

## Live API diagnosis

Site: https://devmentor-ail.vercel.app/

- The deployed frontend JavaScript targets `https://devmentor-api-dqrh.onrender.com`. The public Supabase project URL is also compiled into the frontend. The production API destination is not the localhost fallback.
- First GET `/health`: HTTP 200 after approximately **42.3 seconds**, measured by the response's `x-envoy-upstream-service-time: 42315`. A subsequent request returned HTTP 200 in **0.227 seconds**. This is consistent with the documented Render free-service cold start; it does not prove the reason for every failure.
- Health reports `demo_mode: false`, `supabase_configured: true`, `gemini_configured: true`. These last two flags only test configuration presence, not valid credentials, migrations, permissions, quotas, or model availability.
- OPTIONS `/api/me` with the website origin and `authorization,content-type` headers returned HTTP 200 and the correct `access-control-allow-origin`. This origin's preflight is working.
- Unauthenticated GET `/api/me` returned the expected HTTP 401. This is not evidence of an API defect: a real user access token is required.
- No authenticated production session or Render logs were available. Therefore the user's post-login API/AI failure is **not yet conclusively diagnosed**. Do not infer that Gemini works merely from `/health`.

## Confirmed operational failure

### 1. Scheduled workflows have no effective endpoint or secret — high

GitHub Actions run [38149840197](https://github.com/humaidi09/devmentor-ai/actions/runs/38149840197), job `114500806166`, shows empty `API_BASE_URL` and `CRON_SECRET`, followed by `curl: (3) URL rejected: No host part in the URL`. Recent daily-planning and notification runs also show failure.

Files: `.github/workflows/cron-*.yml`.

Fix: configure the effective repository Actions secrets for these names, with the real Render endpoint and the matching backend cron secret. Add an explicit missing-configuration check. Secret metadata management is denied to the current integration; values were not retrieved or changed.

## Reproduced application bugs

### 2. Production can silently fall back to demo storage — high

Files: `apps/api/app/core/config.py:48`, `apps/api/app/core/store.py:527`, `apps/api/app/api/deps.py`.

`Settings(demo_mode=False, ...valid-looking URL/anon/service values..., supabase_jwt_secret=None).effective_demo_mode` returns `True`. A JWT secret is required by the configuration gate even though token verification supports Supabase's auth endpoint without it. A missing client also falls back to memory. Requests can succeed without durable storage, and missing-token requests can be served as the shared demo user in this configuration. The inspected live health currently reports live mode, so this is a code/configuration hazard, not a claim that the current deployment is using demo storage.

Fix: explicit demo mode; fail startup or return a clear unavailable error for incomplete live configuration; align auth requirements with the actual verification method.

### 3. “Delete all my data” leaves personal records — high

Files: `apps/api/app/api/routes/me.py:12`, `supabase/migrations/0002_rls_policies.sql`.

Local reproduction: create a private snippet, DELETE `/api/me?confirm=true` returns 200, then GET that snippet still returns 200. The deletion list omits `snippets`. Code inspection also finds no DELETE RLS policy for profiles or audit logs, while deletion runs using the user-scoped client. Per-table exceptions are swallowed and success is returned without checking deleted rows. These policies prevent complete deletion in the migration-defined live database.

Fix: define the intended deletion transaction, include owned snippets, handle the RLS/admin boundary explicitly, and verify success before claiming deletion. Auth-account deletion is separately documented and was not tested.

### 4. Repeated planning creates duplicates; weekly replacement is ignored — medium

File: `apps/api/app/api/routes/tasks.py:172`.

Two daily-generation calls produced 7 tasks each, with all 7 repeated titles/start times. Two weekly calls with `replace_existing: true` produced 27 tasks each and 60 total tasks including 6 seed records. The weekly route never reads the replacement flag. Daily replacement also deletes generated completed tasks in the selected day; unscheduled generated revision tasks escape its date-range deletion.

Fix: stable generation identity/date, explicit replacement semantics, preserve completed work, and transactional generation.

### 5. Planner schedules overlapping work outside availability — medium

File: `apps/api/app/services/planner_service.py:115`.

With one 09:00–10:00 availability slot and 09:00/20:00 CP preferences, the planner scheduled 140 minutes. The morning CP block and study block have identical start times. CP blocks are inserted independently of availability and existing tasks.

Fix: reserve time for CP and existing commitments before scheduling study sessions; communicate unscheduled work separately.

### 6. Invalid profile input is accepted and breaks later requests — high

Files: `apps/api/app/schemas/profile.py:31`, `apps/api/app/services/planner_service.py`.

PATCH `/api/me` with `available_schedule: {"mon": "bad"}` returns 200; planning for Monday then returns 500. PATCH with `current_level: null` returns 500 after mutating memory; subsequent GET `/api/me` also returns 500. Update schemas permit explicit null for required output/database fields and treat schedule contents as an arbitrary dict.

Fix: typed schedule slots, valid timezone and start/end ordering, and distinguish omitted fields from forbidden null values. Validate before storing.

### 7. Notification preferences are saved but not consistently respected — medium

Files: `apps/api/app/api/routes/notifications.py`, `apps/api/app/jobs/cron_routes.py`, `apps/api/app/services/notification_service.py:81`.

Local reproduction disabled `in_app_enabled`, `daily_summary`, `weekly_summary`, and `cp_reminders`; daily cron still created 3 notifications. Delivery reads quiet hours from top-level profile fields, while notification preferences write them into `notification_settings`. Immediate notification creation marks a row sent without going through delivery's quiet-hour/cap checks. Summary/channel preference switches are not consulted by the relevant generators.

Fix: one authoritative preferences structure and shared preference enforcement before creation/delivery.

### 8. Demo deadline creation returns 500 — medium

Files: `apps/api/app/api/routes/deadlines.py`, `apps/api/app/core/store.py:182`.

POST `/api/deadlines` with a valid title, exam type and due date returns 500 locally. `DeadlineOut` requires `status`; the route does not set it and MemoryStore does not reproduce the SQL default. The existing test suite misses this path.

Fix: align memory defaults with the database and add a meaningful deadline-create integration test.

### 9. Focus time counts pauses/breaks; ended sessions can be rewritten — medium

Files: `apps/web/src/components/focus-timer.tsx`, `apps/api/app/api/routes/focus.py`.

The browser only pauses its local countdown; server duration is `ended_at - started_at`. A break or long pause therefore becomes study time. Repeating stop recalculates duration for an already-ended session; a local controlled-clock reproduction changed an ended session from 60 to 90 minutes. Client errors are silently ignored. Dashboard study totals read task minutes rather than recorded focus sessions.

Fix: define active-time accounting and a session state machine; make stop idempotent; integrate focus minutes into analytics consistently.

## Additional code-reviewed defects and limitations

### 10. Gemini failures are converted into successful mock responses — high diagnostic impact

File: `apps/api/app/services/gemini_service.py:59`.

Any model exception returns HTTP-success-path mock output. A bad key, unavailable model, quota exhaustion and transport failures are indistinguishable to the UI, whose note incorrectly suggests the key is simply absent. The local no-key chat was confirmed mocked; the production key/model was not exercised.

Fix: return structured provider availability/error categories, expose a useful user message, set explicit request time budgets, and inspect Render logs for the actual production error. Do not log keys. Verify the configured model against the account's available models before changing it.

### 11. Signup navigates to onboarding even without a session — medium

Files: `apps/web/src/lib/auth.ts:18`, `apps/web/src/app/(auth)/sign-up/page.tsx:34`, `apps/web/src/app/onboarding/page.tsx`.

The signup wrapper discards the returned session. The page unconditionally redirects after successful signup, including email-confirmation-required signup where no access token exists. Onboarding is outside the guarded app layout and its save requests then receive 401.

Fix: stay on the confirmation state until verification/sign-in, and guard onboarding.

### 12. API client gives poor failure recovery — medium

File: `apps/web/src/lib/api.ts`.

There is no explicit timeout, backend-waking state, request cancellation, or central handling of expired/missing auth. The observed 42-second cold start can leave the user waiting without a useful explanation. Many callers replace detailed server errors with generic messages. `AuthGuard` only checks a session on mount and treats a failed/null Supabase client as authenticated.

Fix: distinguish authentication, cold start/network, validation, and provider errors; allow retries for safe reads; fail closed on invalid live auth configuration. Do not automatically retry arbitrary writes.

### 13. Chat persistence and actions are incomplete — medium

Files: `apps/web/src/app/(app)/chat/page.tsx`, `apps/api/app/agent/orchestrator.py`.

The UI does not reload stored conversations and loses the current chat on refresh. It drops returned `suggested_actions`/`actions_taken`. Snippet lookup creates `/snippets/{id}` links, but the frontend only has `/snippets`, so a returned match link points to an absent detail route. Persistence exceptions are swallowed, so an answer does not establish that it was saved.

Fix: conversation history endpoints/UI, supported snippet links, and action confirmation controls. Surface failed persistence separately from generation.

### 14. Analytics and CP use inconsistent time semantics — medium

Files: `apps/api/app/services/analytics_service.py:59`, `apps/api/app/services/cp_service.py:76`.

Streak uses mutable `updated_at` as completion time; editing a completed task shifts its completion day. Study totals use scheduled day instead of actual completion day, and zero actual minutes falls back to estimated minutes. CP uses server `date.today()` while dashboard/cron use the user's timezone. Around midnight, recommendations can be assigned to a different day.

Fix: immutable completion timestamps, explicit zero handling, and consistent user-local date boundaries.

### 15. Dependency audit reports outstanding advisories — maintenance/security review

`npm audit --json` reports **11 affected package entries: 8 high, 3 moderate, 0 critical**. This includes dependency-chain entries and must not be interpreted as 11 distinct exploitable production vulnerabilities. Reported packages include Next.js, PostCSS, Tailwind and ESLint tooling/transitive glob packages. Several suggested fixes require major-version changes; do not blindly run `npm audit fix --force`.

Fix: inspect advisory applicability, update compatible transitive versions, then plan framework/tooling upgrades with a production build and browser regression checks. Raw audit output is at `/tmp/devmentor-audit/npm-audit.json` in the current workspace.

### 16. Live-mode coverage and operational checks are insufficient — medium

Files: `.github/workflows/ci.yml`, `apps/api/app/tests/conftest.py`, `apps/api/app/api/routes/health.py`.

All **43 existing backend tests pass**, and `pip check` reports no broken requirements. Tests run in memory/demo mode: they do not validate SQL migrations, live RLS, auth/provider error paths or many mutations above. CI runs frontend types/lint but not a production build or browser tests; Python requirements have no lockfile and CI uses `npm install` rather than `npm ci`.

Fix: add regression coverage for the reproduced failures, migration/RLS integration tests in an isolated database, production-build CI and a few authenticated end-to-end tests. Keep liveness separate from dependency readiness.

## Recommended order

1. Restore cron configuration and capture one authenticated failing request plus corresponding Render log. Never send secret values or bearer tokens in chat.
2. Fix fail-open live/demo configuration, deletion guarantees, and invalid input handling.
3. Fix signup/session flow and meaningful API/provider errors; add regressions.
4. Fix planner idempotency/availability, preferences, timer and analytics.
5. Finish conversation UX and dependency/CI hardening.

The audit is broad, not a proof that every possible defect has been found. Production database migrations/RLS deployment state, real user sessions, Gemini credentials/quota and authenticated browser flows remain unverified. No live user data was modified.
