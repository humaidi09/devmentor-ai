# Close AI web app

Next.js 15 / React 19, strict TypeScript, Node.js 22 in CI. The original Phase 2 design and bilingual demo remain intact; Phase 3 adds Supabase Auth, RLS and student/resource persistence. No external AI or notification integration is used.

## Demo development

```bash
npm ci
npm run dev
```

No credentials are needed. `NEXT_PUBLIC_DEMO_MODE=true` (the default) explicitly selects fictional/local demo data. In an account-enabled deployment `/demo` also provides a separate guest demo. Existing demo preferences/saves are never imported into a real account.

## Account setup

1. Use a Supabase project dedicated to Close AI, or review legacy compatibility before updating a shared old DevMentor database.
2. Apply **all** migrations in repository `supabase/migrations` order (0001–0006). With a linked Supabase CLI project, use `supabase db push` from the repository root. Do not reset a hosted production database. Existing legacy profiles/courses/CP tables are adapted; unused old private-table client grants are revoked.
3. Optionally run `supabase/seed-demo.sql` as a trusted SQL operator. It contains fictional DEMO resources only, not personal test users or real contacts.
4. Enable Supabase email/password Auth. For hosted accounts keep email confirmation enabled; set the Auth Site URL and allow the exact website `/auth/callback` URL. Local test auto-confirm is only a fixture setting, not a production recommendation.
5. Copy `.env.example` to `.env.local`, fill the **public** project URL and anon/publishable key, set `NEXT_PUBLIC_DEMO_MODE=false` and `NEXT_PUBLIC_ACCOUNT_MODE_ENABLED=true`, and set `CLOSE_AI_SITE_URL` to this deployment's canonical HTTPS origin. Configure preview deployments with their own allowed origin/redirect, rather than reusing the production origin.
6. Build/deploy with those variables. No service-role key is used. Browser keys do not bypass RLS. Legacy credentials/flags alone never enable account mode; the new account flag must be explicit.

Maintainer/reviewer/admin resource roles are granted by a trusted SQL operator, scoped to a campus:

```sql
insert into public.resource_roles (user_id, campus_id, role)
values ('<verified-auth-user-uuid>', '<campus-id>', 'resource_maintainer');
```

A reviewer receives `resource_reviewer`. These roles grant no access to other students' private data. Operator role management is intentionally not exposed through a student-facing API.

## Normal checks

```bash
npm run typecheck
npm run lint
npm run test:logic
npm run build
npm start -- --hostname 127.0.0.1 --port 3001
```

In a second terminal, install Chromium and run `npm run test:browser`. That suite explicitly selects demo mode and covers 20 routes, English/Bangla mobile layout, axe rules, keyboard controls and offline reload/chat/navigation. `PLAYWRIGHT_EXECUTABLE_PATH` can select an installed Chromium. Tests never target the live website.

## Reproducible backend/auth tests

Docker is required. From the repository root:

```bash
bash supabase/test-stack.sh reset
```

`reset` deletes **only the disposable `close-ai-phase3` test containers/volumes**. The stack binds to loopback ports 55432 (Postgres), 59999 (actual GoTrue Auth) and 53000 (PostgREST). It applies every migration and the fictional seed. The committed passwords/JWT secret in this fixture are public local-test values; never use them in a hosted project.

From `apps/web`, keep the gateway running in one terminal:

```bash
node tests/local-gateway.cjs
```

Then:

```bash
npm run test:backend
npm run build:account-test
node tests/start-account.cjs
```

In another terminal:

```bash
npx playwright install chromium
npm run test:account-browser
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:browser
```

The test build uses generated local anon JWTs, not real project credentials. Backend checks use two students, a maintainer and a reviewer against actual RLS; browser checks verify account persistence and authorization. Stop the disposable stack with `docker compose -p close-ai-phase3 -f supabase/compose.test.yml down -v` from the repository root.

## Data and privacy

Profile/module choices, private saves/plans/steps, consent changes and optional manual learning progress use the signed-in user's session and RLS. Support storage/reminder intent is opt-in. Writes show errors on failure and await database confirmation. Campus-not-listed leaves real account resources empty; choose explicit demo mode to explore fictional resources.

Chat remains a deterministic fictional mock and is not stored. Visual definitions/playback stay local. Reminders store intent and quiet-hour preferences; they send no email/push/SMS. CP handles are unverified preferences, not synchronized profiles.

Settings support JSON export, individual step/plan/save deletion and confirmed transactional app-data reset. Reset retains the Auth login and creates default profile/preferences. Full Auth-account deletion is operator-assisted and visibly marked as such.

## Offline boundary

`prebuild` generates a uniquely versioned `public/sw.js`. Only public fictional demo documents and static assets can enter its allowlist. A server public-demo marker distinguishes safe fictional HTML in a mixed deployment. API/export responses, user messages and personalized account responses are not cached. Account mode unregisters the worker and deletes only Close AI's demo caches. Initial online caching is required; external links need a connection.

See the repository [Phase 3 report](../../PHASE_3_REPORT.md), [architecture](../../docs/ARCHITECTURE.md) and [authorization/privacy boundaries](../../docs/PRIVACY_AND_SAFETY.md).
