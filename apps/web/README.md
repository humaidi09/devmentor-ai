# Close AI web app

Next.js 15 / React 19, strict TypeScript, Node.js 22 in CI. The original Phase 2 design and bilingual demo remain intact; Phases 3–5 add Supabase Auth/RLS, grounded optional Gemini chat, in-app reminders, optional Codeforces public data and transparent learning progress.

## DSA visual lessons

Visual Lab has 25 main DSA lessons, including the 23 CP categories plus advanced patterns and range queries, and 52 separate pattern lessons from the 16 branches of the reference map. Each of these 77 topics has its own original 64-second portrait MP4, a Bengali/English plain-language concept and worked example, and a separate interactive step player. The MP4s are silent, contain bilingual on-screen explanations, and show a topic-specific worked example changing over time: values swap, pointers move, stacks grow and shrink, tables fill, and graph searches advance. They can be paused/replayed and have written equivalents beside the player. The four supplied reference clips informed the worked-example approach; none of their footage, audio or watermarks is included.

The committed assets live in `public/videos/dsa`. To regenerate them, install Python Pillow and FFmpeg with `libx264`, ensure Noto Sans Bengali is installed, then run `npm run videos:build` after `npm ci`. `scripts/dsa_storyboards.py` supplies the worked data states; the renderer writes one MP4 and poster per topic. Regeneration is an authoring step, not part of the Next.js build.

## Demo development

```bash
npm ci
npm run dev
```

No credentials are needed. `NEXT_PUBLIC_DEMO_MODE=true` (the default) explicitly selects fictional/local demo data. In an account-enabled deployment `/demo` also provides a separate guest demo. Existing demo preferences/saves are never imported into a real account.

## Account setup

1. Use a Supabase project dedicated to Close AI, or review legacy compatibility before updating a shared old DevMentor database.
2. Apply **all** migrations in repository `supabase/migrations` order (0001–0010). With a linked Supabase CLI project, use `supabase db push` from the repository root. Do not reset a hosted production database. Existing legacy profiles/courses/CP tables are adapted; unused old private-table client grants are revoked.
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

In a second terminal, install Chromium and run `npm run test:browser`. That suite explicitly selects demo mode and covers 24 routes, English/Bangla mobile layout, axe rules, keyboard controls and offline reload/chat/navigation. `PLAYWRIGHT_EXECUTABLE_PATH` can select an installed Chromium. Tests never target the live website.

`npm run test:upgrade-browser` covers Live Knowledge search/save, Study handoff and CP hint-to-visual-to-practice navigation. Live Knowledge uses server-side Crossref, World Bank and GitHub adapters. `GITHUB_SEARCH_TOKEN` is optional and server-only; unauthenticated GitHub search has a lower provider rate limit. Account users can opt into Gemini source-backed explanation when `AI_PROVIDER=gemini` and an AI key are configured; the query and public metadata are sent only after an explicit checkbox. Demo search does not use Gemini. Migration `0010` adds per-user saved knowledge and extends existing CP progress; apply it before enabling those account features.

The CP Library includes a checked-in catalog of 1,260 problem links and metadata: 600 Codeforces, 600 free LeetCode, and 60 CodeChef. It supports platform, topic, difficulty, title, progress, and Codeforces-rating filters. The catalog is a dated snapshot, not live data or copied problem statements. Run `python3 scripts/refresh-cp-catalog.py` from `apps/web` to refresh it from each platform's public metadata endpoints, then review the generated diff and run `npm run test:logic`. Codeforces topic pages can also load newer public API entries while online. LeetCode difficulty is platform-authored. Codeforces ratings below 1400 are shown as Easy, 1400–1899 Medium, and 1900+ Hard in the snapshot; CodeChef uses below 1200, 1200–1999, and 2000+ respectively. Original platform ratings remain visible. These bands are a browsing aid, not a cross-platform equivalence.

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

Account chat uses campus-verified database resources with mock or explicitly opted-in server-side Gemini selection. Chat is not stored. Visual definitions/playback stay local. In-app reminders deliver while the app is open, respecting approved schedules, consent, category settings and quiet hours. No email/push/SMS is configured. Codeforces handles require public-profile preview and explicit confirmation; disconnect removes the identifier. Older unconfirmed handle preferences are not treated as connected.

Settings support JSON export, individual step/plan/save deletion and confirmed transactional app-data reset. Reset retains the Auth login and creates default profile/preferences. Full Auth-account deletion is operator-assisted and visibly marked as such.

## Offline boundary

`prebuild` generates a uniquely versioned `public/sw.js`. Only public fictional demo documents and static assets can enter its allowlist. A server public-demo marker distinguishes safe fictional HTML in a mixed deployment. API/export responses, user messages and personalized account responses are not cached. Account mode unregisters the worker and deletes only Close AI's demo caches. Initial online caching is required; external links need a connection.

See the repository [Phase 3 report](../../PHASE_3_REPORT.md), [architecture](../../docs/ARCHITECTURE.md) and [authorization/privacy boundaries](../../docs/PRIVACY_AND_SAFETY.md).

## Phase 4/5 checks

After the local stack/gateway are ready, run `npm run test:backend`, `npm run test:grounding-backend`, `npm run test:phase5-backend`. Build/start with `npm run build:account-test` and `node tests/start-account.cjs`. Account browser scripts use `http://localhost:3002`; run `npm run test:account-browser`, `node tests/ai-browser.cjs`, `npm run test:phase5-browser`, and `TEST_BASE_URL=http://127.0.0.1:3002 npm run test:browser`. Use system Chromium via `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium` when appropriate. Do not rebuild the same `.next` while its server is running.

`npm run test:ai-live` and `npm run test:codeforces-live` are explicit optional real-network tests with public fictional/Codeforces data; CI uses deterministic adapters. `CLOSE_AI_LIVE_TESTS=1 npm run test:phase5-browser` additionally verifies the real local account Codeforces connect/disconnect flow. This does not configure a hosted deployment. AI keys remain server-only; Codeforces uses no key; email/push remain deferred. See [Phase 4](../../PHASE_4_REPORT.md) and [Phase 5](../../PHASE_5_REPORT.md) reports for actual outcomes.

For a shorter explicit real connection check, run `npm run test:codeforces-live-browser` against the local account server. This creates a disposable local fixture account, previews the public `tourist` profile, confirms only after an explicit consent checkbox, verifies persistence, and disconnects in Settings. It is not part of CI.
