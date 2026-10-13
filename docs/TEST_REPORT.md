# Close AI Phase 6 test report — 2026-10-13

## Scope and environment

Repository `main` at `951efe4` was the baseline. Web tests ran with Node/npm in `/workspace/devmentor-ai/apps/web`; PostgreSQL 17, GoTrue and PostgREST ran in the loopback-only `close-ai-phase3` Docker fixture after `bash supabase/test-stack.sh reset` applied migrations `0001`–`0009` and fictional seed data. Chromium at `/usr/bin/chromium` served the local account build and demo. The FastAPI mock tests used a temporary Python venv. Real Gemini and Codeforces checks used fictional/public data only. The final header change was validated in a rebuilt local demo. No hosted user data was tested.

`PASS (local)` means the stated scenario passed in the disposable environment, not on production. `BLOCKED` means the prerequisite is missing. Severity describes the consequence if that gate remained unmet at pilot release.

| Feature | Test scenario | Expected result | Actual result | Status | Severity if failed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | Purpose, primary support path, module links and fictional label | Clear entry and DEMO separation | Present; homepage/mobile browser routes passed | PASS (local) | High | Human screen-reader review pending |
| Onboarding | English/Bangla, optional campus/modules/quiet hours, skip | Saves choices without trapping user | Browser flow passed | PASS (local) | High | Fictional campus only |
| Auth | Signup, signin, signout, private route, invalid input | Verified session and safe errors | Local GoTrue/API/browser suites passed | PASS (local) | Blocker | Hosted email confirmation/expiry unrun |
| User isolation | User A attempts User B profile, saves, plans, reminders, notifications and learning data | Denied by RLS/ownership | Direct database negative checks passed | PASS (local) | Blocker | 32/32 public tables RLS-enabled locally |
| Staff roles | Student cannot grant role; maintainer/reviewer confined to campus resources | No private student access or forged review | Direct RLS and maintainer UI passed | PASS (local) | Blocker | Admin is resource-scoped; no student-data admin UI |
| Student Support | Academic/financial/technology/unknown and immediate human paths | Relevant source or honest uncertainty/human route | Logic, browser chat and human route passed | PASS (local) | High | Real campus contacts absent |
| AI grounding | Verified/current campus source vs stale, unverified, archived, wrong campus | Only current checked source trusted | Grounding logic and DB retrieval passed | PASS (local) | Blocker | Live resource accuracy unverified |
| Missing facts | No cost, contact or eligibility | Say unknown, invent nothing | Controlled fact renderer tests passed | PASS (local) | Blocker | Test corpus only |
| Prompt injection | Malicious resource/model/user content | Treated as data; no policy/tool escape | Strict output and retrieved injection tests passed | PASS (local) | Blocker | No document uploads supported |
| Provider failure | Timeout, malformed output, rate limit, invalid result | Manual directory/human fallback | Logic and browser failure flows passed | PASS (local) | High | Preview Gemini model availability can change |
| User control | AI draft approval/consent and no automatic reminders/contact | No silent mutation | Backend/browser approval and retry checks passed | PASS (local) | Blocker | Conversation is memory-only |
| Action plans | Create/edit/reorder/status/delete, wrong parent/user | Own confirmed records only | Account browser and backend checks passed | PASS (local) | High | Large account/export not load tested |
| Saved resources | Save/unsave, duplicate/ownership | Own consented record only | Account and RLS tests passed | PASS (local) | High | Archived live record behavior needs staging check |
| Resource lifecycle | Draft → review → verified, edit downgrade, audit | Reviewer evidence required | Local staff/RLS tests passed | PASS (local) | Blocker | No real reviewer assigned |
| Real pilot resources | Verify all official sources, campus, contact, dates | Complete approved corpus | No real corpus supplied; seed is DEMO | BLOCKED | Blocker | Pilot cannot use fictional resources |
| Notifications | Preferences, delivery, read/unread/all-read/dismiss, ownership | Consent and own generic content | Phase 5 DB/browser tests passed | PASS (local) | High | Open-app delivery only |
| Reminders | Once/daily/weekly, DST/quiet/disabled/category, retry dedupe | Correct approved schedule | Phase 5 DB/browser tests passed | PASS (local) | High | No off-app/email/push delivery |
| Codeforces | Valid/invalid/malformed/offline/429, consent, disconnect | Safe failure and manual CP fallback | Logic, browser, real public API and real connect/disconnect passed | PASS (local) | Medium | Public submission history is a 50-item sample |
| CP Coach | Manual statuses, topic/rating, hints and visual links | No rating promise; manual remains usable | Logic/Phase 5 browser passed | PASS (local) | Medium | Manual catalog is intentionally small |
| Visual Learning | BFS/DFS/sort/search/join/3NF logic and controls | Correct frames, pause/text/keyboard | Six logic tests and 20-route browser suite passed | PASS (local) | High | Human screen-reader review pending |
| Academic Study | Course/deadline/task and editable suggestion | Approval before schedule change | Account/Phase 5 browser passed | PASS (local) | Medium | Rule-based, not an external AI decision |
| Developer Path | Path/milestone/project status and continue | Explicit progress, no job promise | Phase 5 logic/browser passed | PASS (local) | Medium | Manual progress |
| Settings/privacy | Language, modules, consent, export/reset | Own data, honest deletion language | Browser and RLS reset/export passed | PASS (local) | High | Full Auth deletion remains operator-assisted |
| Full Auth deletion | Operator deletes test user and audits residual data | User and app data removed as documented | No hosted operator access; not executed | BLOCKED | High | Required before pilot |
| Accessibility | Axe, keyboard, headings, visible focus, reduced motion | Tested flows operable | Demo/account/AI/Phase 5 suites passed; no detected axe A/AA failures | PASS (local) | High | Automated checks are not WCAG certification |
| Responsive | 320/360/768/1440 px across main routes | No horizontal overflow | 10 routes at 320/768/1440 and suite 360/1440 passed | PASS (local) | High | Real devices/tablet interaction pending |
| Low bandwidth/offline | Throttled human page; cached demo, external failure | Core path remains understandable | Throttled page content in 1.6s; demo offline regression passed | PASS (local) | Medium | No broad network/CPU lab matrix |
| Headers/cache | HTML and API security headers; private account caching | Browser protections, no private offline cache | Local response headers and browser cache tests passed | PASS (local) | High | Hosted deployment of Phase 6 header change pending |
| Build/secrets | Typecheck, lint, default/account build, client scan | Clean build, no privileged browser secret | All passed; 53 bundles scanned | PASS (local) | Blocker | No service-role web client |
| Dependencies | Audit production package graph | No unresolved severe issue without review | 1 high PostCSS, 1 moderate Next advisory | OPEN | High | No safe automatic fix reported; [security review](SECURITY_REVIEW.md) |
| Hosted deployment | Supabase migrations, Auth redirect and Vercel account flags | Tested account website | Supabase Management 401; Vercel project/team 404/403; public site is demo | BLOCKED | Blocker | Requires authorized project access |
| Recovery/monitoring | Backup/restore drill and private aggregate alerts | Proved restoration and named response owner | Not configured/tested | BLOCKED | High | Required for pilot |

## Commands and actual outcomes

- `npm ci --cache /tmp/close-ai-phase6-npm-cache`, `npm run typecheck`, `npm run lint`, `npm run test:logic`: passed; **36/36** web logic tests.
- `npm run build` (demo), `npm run build:account-test`, `npm run test:client-boundary`: passed; final scan covered **53** client bundles. Final demo rebuild after header change also passed.
- `bash supabase/test-stack.sh reset`, `npm run test:backend`, `npm run test:grounding-backend`, `npm run test:phase5-backend`: passed on a fresh local database.
- `npm run test:account-browser`, `node tests/ai-browser.cjs`, `npm run test:phase5-browser`, `TEST_BASE_URL=http://127.0.0.1:3002 npm run test:browser`: passed with system Chromium. The last suite checked 20 routes in English/Bangla plus offline behavior.
- `npm run test:ai-live`, `npm run test:codeforces-live`, `npm run test:codeforces-live-browser`: passed using fictional or public data. Codeforces returned a validated profile, 50 submissions and public problem sample.
- Legacy FastAPI `pytest -q` first failed two mock-expectation tests because an injected real `GEMINI_API_KEY` changed provider selection. Rerun with the key omitted and `AI_PROVIDER=mock` passed **43/43** tests; no product code change was needed.
- `npm audit --omit=dev` found 1 high/1 moderate advisory; full tree found 8 high/3 moderate. Advisory details and scope are in [SECURITY_REVIEW.md](SECURITY_REVIEW.md).
- Local `curl` confirmed HTML and `/api/status` carry Phase 6 security headers. A Chromium smoke checked 10 routes at 320/768/1440 px and one 400 ms latency/50 KiB/s Human Support load.

## Not run or not proven

Hosted migrations/RLS, email confirmation delivery, hosted cookies/session expiry, real campus source review, full operator Auth deletion, backup restore, external monitoring and manual screen-reader/device testing were **not run**. No real limited pilot was conducted. The public website's `/api/status` reported demo mode and no Supabase configuration before Phase 6 changes; no Phase 6 deployment is claimed by this report.

## Major Knowledge/CP upgrade release — 2026-10-13

The original Phase 6 table above records its earlier baseline. The later Knowledge/CP upgrade is described in [its implementation report](../MAJOR_FEATURE_UPGRADE_REPORT.md). GitHub `main` release `1032e8f` passed all three CI jobs: web build/browser checks, account/RLS integration and API pytest. Local upgrade verification also passed 47 logic tests, 24 bilingual demo routes, the focused Knowledge/CP mobile axe test, a real disposable account/database flow and a 62-bundle client secret boundary scan.

Hosted smoke on `https://devmentor-ai-rho.vercel.app` returned HTTP 200 for `/`, `/knowledge`, `/cp/library`, `/cp/topics/bfs` and `/learn/visual-lab/bfs`; `/api/status` returned `mode=demo`, `supabaseConfigured=false`, `revision=1032e8f`. Public World Bank Bangladesh inflation and GitHub repository searches returned source-backed results; the sorting CP endpoint returned 20 problems, 18 from live Codeforces metadata. HTML exposed CSP, frame and content-type protection headers. The saved-knowledge account API returned `503 Account service unavailable`, as expected in demo mode.

**Still blocked for hosted account rollout:** Supabase Management access returned 401 (`JWT could not be decoded`), so migration `0010`, hosted Auth and account persistence were not applied or tested. The current Vercel token cannot list the `hussain8` team (403), although its GitHub integration deployed the demo successfully. Backup/restore and real campus review gates remain open.
