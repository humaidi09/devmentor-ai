# Close AI — Phase 6 review (2026-10-13)

## Repository Status

The current product is the Next.js web application in `apps/web`, backed by Supabase Auth, PostgreSQL and RLS for optional accounts. It has a separate fictional browser demo. The older FastAPI `apps/api` service and legacy cron files are retained but are not called by Close AI. Phase 2–5 code was merged to `main` before this review. Phase 6 added conservative web security headers and the documents linked below; these changes are not yet claimed as deployed.

Implemented modules: bilingual Student Support and resource directory, source/verification labels, plans/steps, Academic Study, Developer Path, CP Coach, six deterministic Visual Learning topics, optional Codeforces, in-app reminders and account settings/export/reset. Support chat uses current campus resources with strict model-output validation and manual/human fallback. The app has no real campus corpus, off-app notifications, self-service Auth deletion or in-app feedback receiver. Legacy FastAPI docs had a misleading old deployment procedure; [deployment guidance](docs/DEPLOYMENT.md) now describes the actual web app.

## Functional Testing

The [test matrix](docs/TEST_REPORT.md) distinguishes local passes from hosted blockers. Fresh local migrations `0001`–`0009`, 36 web logic tests, 43 legacy FastAPI mock tests, account/AI/notification backend suites, account and bilingual demo browser suites, production builds and real public Gemini/Codeforces smoke checks passed. The browser suites covered consented saves/edits/deletes, mock and database support, optional progress, reminders and offline fallback. No severe local functional failure was found. The first FastAPI run failed only because this cloud environment injected a real Gemini key into mock tests; rerunning with the provider fixed to mock passed all 43 tests.

## Security Review

All 32 public tables in the fresh local fixture had RLS enabled. Direct two-user and staff-role tests rejected cross-user access; server routes independently validate session, origin, input and ownership. No service-role or AI secret was found in 53 browser bundles. Phase 6 added `nosniff`, frame denial, limited CSP (`frame-ancestors`, object and base), referrer and permissions headers; local HTML/API requests confirmed them. `npm audit --omit=dev` found one high PostCSS and one moderate Next advisory without a safe automatic fix; attack surface and follow-up are documented in [SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md). Hosted auth/RLS and a full script/style CSP remain unverified.

## Privacy Review

Support transcripts remain memory-only; provider use sends one current message and bounded public resource summaries by per-message choice. Consent and approval guard support saves, plans, reminders and Codeforces identifiers. Account responses are private/no-store and excluded from demo offline caches. Export and transactional app-data reset were tested for owner isolation. Full Auth-user removal is operator-assisted and was not exercised on a hosted project; provider/Auth operational retention is outside the app-data reset.

## Accessibility Review

English/Bangla demo and account route browser suites passed automated axe A/AA checks for tested pages, keyboard/focus and reduced-motion checks, and 360 px mobile overflow checks. Additional 320/768/1440 px smoke checks found no overflow on 10 primary routes at each width. This is not WCAG 2.2 certification. Human screen-reader, touch-target/contrast and physical-device review remain before a pilot.

## AI Safety Review

Verified/current campus retrieval, missing-fact honesty, prompt-injection isolation, malformed/unsafe model response rejection, provider timeout/rate-limit fallback, high-risk human routing and explicit draft approval passed local tests. A real Gemini call with fictional context returned one validated resource and two steps. Keyword safety routing is limited, and the tested model is a preview; real campus prompts need human review.

## Resource Verification Review

The local lifecycle and reviewer evidence/audit controls passed. Fictional demo records remain labelled DEMO. No real pilot campus, sources, contacts or independent reviewer has been provided, so resource accuracy and human handoff cannot be signed off. [Pilot operations](docs/PILOT_OPERATIONS.md) specifies the correction process and required owners; the product currently has no independent feedback submission service.

## Integration Review

In-app once/daily/weekly reminders passed explicit approval, quiet hours/DST, dedupe, generic preview, read/dismiss and wrong-user tests. Codeforces adapter passed invalid/timeout/rate-limit/oversize cases, a real public-data request and a real local account preview→consent→connect→disconnect flow. Manual CP remains available after failure. No email, push, LMS or remote background delivery is configured.

## Performance Review

The default production build reported about 103 kB shared first-load JavaScript and about 121–131 kB on the primary routes; fonts are local and there are no large image assets in the core flows. A 400 ms latency/50 KiB/s Chromium check loaded Human Support content in about 1.6 seconds in this local environment. No production Core Web Vitals, load, database query or large-account export benchmark has been run. Resource lists are bounded and large-corpus pagination/streaming remains technical debt.

## Pilot Preparation

[PILOT_EVALUATION.md](docs/PILOT_EVALUATION.md) defines a small bilingual task-based evaluation, practical success measures and minimal feedback. [PILOT_OPERATIONS.md](docs/PILOT_OPERATIONS.md) defines owner roles, resource correction, incident response and recovery requirements. All named roles are currently unassigned, and no real resource or reporting channel is verified. The [pre-launch checklist](docs/PRE_LAUNCH_CHECKLIST.md) keeps these gates open.

## Deployment Readiness

The public `devmentor-ai-rho.vercel.app` website reported revision `951efe4`, `mode=demo` and `supabaseConfigured=false` on 2026-10-13. It is a working fictional demo, not an account/pilot deployment. The cloud Supabase Management credential returned 401 (`JWT could not be decoded`). The available Vercel token authenticated, but could not access the `hussain8` team (403) or the `devmentor-ai` project by slug (404). Hosted migrations, account environment variables, Auth redirects, real source records, backup/restore and monitoring were not changed or verified. [DEPLOYMENT.md](docs/DEPLOYMENT.md) describes the exact staging/pilot procedure.

## Tests Actually Run

See [TEST_REPORT.md](docs/TEST_REPORT.md) for commands, matrix, counts, environment and skipped items. In particular: default and account builds, typecheck/lint, 36 logic tests, 43 legacy mock tests, three local backend suites, four browser suites, real AI/Codeforces checks, client secret scan, local security-header requests, 30 responsive route-width checks and one throttled page check passed. Initial two FastAPI failures were corrected by removing the injected real key for mock tests, then the entire suite passed.

## Known Limitations

Full Auth deletion needs an operator; full hosted session/confirmation behavior is untested. In-app reminders require an open signed-in app. Codeforces history is a sample; its throttle/cache is per-process plus a durable per-user budget. Gemini model availability can change. No independent in-app correction/feedback receiver, external monitoring, tested restore, real campus data, large-corpus pagination, streamed export or manual screen-reader audit exists. The dependency advisory review is open. Historical `apps/api` remains but is unused by Close AI.

## Remaining Blockers

1. Repair Supabase Management authorization and obtain access to the intended hosted project; review legacy migration impact, apply migrations and verify hosted RLS/Auth using two staging users.
2. Grant access to the Vercel project behind the intended domain, set the account variables/canonical URL and Auth redirects, redeploy and test live private flows.
3. Name a campus maintainer, independent reviewer, support escalation, feedback, privacy and backup owners; verify every real source and provide a reachable correction channel.
4. Test operator Auth deletion, backup/restore, hosted headers/cookies, human accessibility and monitoring. Review the outstanding production dependency advisories before pilot release.

## Final Recommendation

**READY FOR INTERNAL TESTING**

The locally verified implementation can support controlled internal tests with the disposable fixture or an authorized staging project. The Phase 6 pilot exit criteria are **not** met, and a limited real campus pilot must not start until the blockers and unchecked [pre-launch gates](docs/PRE_LAUNCH_CHECKLIST.md) are resolved and evidenced.
