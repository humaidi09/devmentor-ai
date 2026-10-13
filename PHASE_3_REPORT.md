# Close AI — Phase 3 implementation report

Updated 2026-10-13.

## Repository inspection and baseline

Phase 3 starts from Phase 2 commit `0f2cbde`, on `codex/close-ai-phase3`. Phase 2 PR #2 remains separate. The application is `apps/web` (Next.js 15, React 19, strict TypeScript, Tailwind). The separate `apps/api`, root legacy documentation and migrations 0001–0004 describe the earlier DevMentor product; Close AI does not call that service.

Existing pages: landing, onboarding, dashboard, support/mock chat, directory/detail, saved resources, next steps, human support, study, developer pathways/snippets, six Visual Learning topics, CP manual tracking and settings. Reusable cards/buttons/inputs, bilingual copy, deterministic support matching, algorithm generators/renderers and playback controls are preserved. Phase 2 had a public anonymous Supabase client utility but no working authentication; `/api/chat` was the only Next.js backend route, with deterministic fictional results.

Baseline commands actually ran: `npm install`, `npm run typecheck`, `npm run test:logic` (13 passed) and `npm run build` passed. npm's default cache was inaccessible for the new dependency installation, so the install used a writable `/tmp` cache. No product redesign was needed.

## Database and migration compatibility

- 0005 adds campuses, module preferences, resource categories/resources/sources/review events, campus-scoped resource roles, saved resources, action plans/steps, append-only consent records, reminders, developer progress and CP manual progress.
- Existing profiles gain campus selection; existing CP preferences gain a manual handle and reminder intent. Existing courses/deadlines are reused with an ownership foreign key. 0006 adds learning tasks, atomic step ordering, consent auditing/enforcement and transactional app-data reset.
- UUID user IDs reference `auth.users`; plan/step/reminder ownership is enforced by composite foreign keys and RLS. Resource/campus keys retain existing demo identifiers so working links/translations continue to work.
- Existing migrations are preserved. Unused legacy private tables have their public client grants revoked. This intentionally retires access through the older DevMentor clients; do not apply the migration to a shared legacy production application without assessing that change.
- `seed-demo.sql` is re-runnable and contains fictional records only, always `is_demo=true`. No real campus or service is invented. `scripts/seed-close-ai.ts` regenerates it from the existing Phase 2 corpus.

## Authentication and sessions

Email/password signup, signin, signout, confirmation callback and cookie sessions use Supabase Auth with `@supabase/ssr`. Signup requires at least 12 characters. Authentication failures use safe general messages. Supabase supplies authentication rate limiting and password hashing.

Middleware refreshes cookies and verifies the user with `getUser`; private pages redirect to auth. Every private API independently verifies the user. The user ID is taken from the verified session, never a browser ownership field. Same-origin checks protect mutations. Redirect targets are restricted to local paths, and public-host/canonical-origin handling supports reverse proxies.

Demo is explicit: no configuration, `NEXT_PUBLIC_DEMO_MODE=true`, or the absence of the new `NEXT_PUBLIC_ACCOUNT_MODE_ENABLED=true` opt-in keeps local fictional behavior; `/demo` selects demo mode in an account-enabled build. Account screens do not import browser demo saves or seed personal user plans.

## Authorization and resource lifecycle

All public tables have RLS. User-owned rows remain owner-only; a maintainer/reviewer/admin resource role never expands profile/plan/support permissions. Role grants require a trusted SQL operator and are never derived from editable user metadata.

Campus maintainers may draft/edit resources, attach sources and submit for review. Reviewers may change verification state through a validated operation; verification needs checked evidence and cannot revive a known expired date. Editing verified content or its source returns it to `needs_review`. DEMO/scope markers cannot be relabeled through client updates. State changes append internal review events. Students cannot see review notes or create verification events. Drafts and never-published review submissions are hidden; previously verified review-pending information remains visibly uncertain.

`/maintainer` and `/api/maintainer` form a limited resource workspace. It has no student-data browsing or conversation features.

## Frontend persistence

- Profile: name/language/timezone/campus, with account-visible settings.
- Module/reminder preferences and quiet hours: server persistence; reminder changes create consent history.
- Directory/detail/human contacts: database resources, source metadata and explicit state/DEMO labels; account selection scopes the resources to the chosen campus.
- Saved resources: per-user save/unsave after explicit support-storage consent.
- Next Steps: named plans, step creation/edit/status/dismiss/delete, atomic ordering, whole-plan deletion and stored reminder intent.
- Study: private courses, deadlines and manual study tasks.
- Developer: existing milestone controls persist progress; educational definitions stay local.
- CP: manual status and unverified handle preferences persist; no Codeforces request.
- Data controls: owner-scoped JSON export and confirmed transactional reset. Reset keeps the sign-in account and restores defaults; full Auth-account deletion remains an operator-assisted flow.

Database requests expose loading/empty/error states. Writes use confirmed server results instead of optimistic success. Sensitive support conversations are not persisted or logged. Resource roles are separate from all personal data controls.

## Demo and offline behavior

The existing bilingual frontend, deterministic mock chat, static educational examples, visual controls and local demo saves/preferences remain available. Account mock chat explicitly says that its results are fictional; it does not pretend to be live AI or real database-grounded support.

Only public demo documents and static assets are cached. Account responses use private/no-store headers. Entering account mode unregisters Close AI's worker and clears its own demo caches. The worker never caches API or export responses; a server-issued public-demo marker allows safe fictional pages in an account-enabled build. No private response becomes an offline cache entry.

## Verification

The following actually ran against the final implementation:

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — no warnings/errors |
| `npm run test:logic` | PASS — 19 tests |
| `npm run build` | PASS — default demo production build |
| `node tests/build-account.cjs` | PASS — account-mode production build with explicit account flag |
| `bash supabase/test-stack.sh reset` | PASS — clean local Auth/database, every migration, seed |
| `npm run test:backend` | PASS — real local signup/signin/signout, two-user RLS, owner foreign keys, consent/reminder withdrawal, resource staff separation, audit/verification, own-data reset; every public table has RLS |
| `npm run test:account-browser` with installed Chromium | PASS — auth/session, profile/preferences/campus, database resources/saves, plans/steps edit/reorder/complete, study persistence, maintainer draft, input/CSRF denial, export payload and restored own state after signin |
| Account browser accessibility/mobile | PASS — 6 new/integrated account routes, no detected axe A/AA violations, no overflow at 360px; no browser page errors |
| `TEST_BASE_URL=http://127.0.0.1:3002 npm run test:browser` with installed Chromium | PASS — preserved 20-route demo, English/Bangla mobile, keyboard/visual controls, offline chat/navigation, API cache exclusion and scoped local deletion |
| Default demo HTTP smoke | PASS — dashboard needs no login; private account API disabled by default |
| Privileged environment references in `src` / built `.next/static` | None found; no service-role client used |
| `git diff --check` | PASS |

Integration uses actual local Supabase GoTrue + PostgreSQL + PostgREST, not an in-memory auth/database mock. The local fixture auto-confirms email; hosted email delivery was not tested. CI now has a dedicated Auth/RLS integration job in addition to the existing demo checks. Automated axe checks are evidence for tested routes, not WCAG certification or a human screen-reader review.

Validation caught and corrected a public-host redirect/CSRF issue, a mode-changing demo link that was being prefetched, and test selectors that were racing confirmed database updates. The mode-changing link now requires an actual user navigation; account HTML is private/no-store and the tested account browser contains no Close AI offline cache.

## Local commands

From the repository root: `bash supabase/test-stack.sh reset` starts a disposable loopback-only PostgreSQL/GoTrue/PostgREST fixture and applies every migration and the demo seed. In `apps/web`, run `npm ci`, `node tests/local-gateway.cjs`, `npm run test:backend`, `npm run build:account-test`, `node tests/start-account.cjs`, and `npm run test:account-browser`. See the web README for separate terminals and Chromium installation. Tests never point at a hosted database.

## Known limitations and Phase 4 readiness

- Hosted Supabase credentials have not been validated: the available management credential returned HTTP 401. No hosted schema, Auth settings or production deployment is claimed to be updated.
- Full Auth-account removal is operator-assisted; UI clearly distinguishes it from functional app-data reset. Confirmation-email delivery/callback is implemented but live delivery requires the hosted Auth configuration; the local test fixture auto-confirms.
- Real campus verification and role grants require an operator; the seed is entirely fictional.
- Reminders persist intent only; no delivery, email provider, push or SMS.
- Resource workspace/directory are bounded to a small pilot corpus (100 resources per request). A large corpus needs pagination. Export paginates owner records; very large exports still need a streaming/time-limit design.
- Visual Learning progress remains local/transient; the educational definitions do not need a database.
- Production AI, resource-grounded chatbot, RAG, embeddings, Codeforces integration, external notifications and analytics are outside Phase 3.

Phase 4 is not started. Local Phase 3 core exit checks pass and the implementation is ready for review. Hosted deployment/configuration and Auth email delivery remain unverified; production readiness is not claimed. Do not begin Phase 4 or treat real campus/AI support as available until the relevant deployment and next-phase scope are explicitly approved.

## Changed-file groups and review map

- Authentication/session: `apps/web/src/middleware.ts`, `lib/auth/*`, `lib/supabase/*`, `app/auth/*`, `app/api/auth/route.ts`, demo entry, root providers/layout and account controls.
- Persistence/input boundaries: `lib/validation`, `lib/server-api`, `lib/account*`, `lib/resources`, `app/api/account`, `data/[kind]`, `resources`, `export` and `maintainer` routes.
- Existing frontend adapters: onboarding/settings, directory/detail/saved/human/dashboard, steps, study/developer/CP pages; added account profile/study/status components and the limited maintainer page. Visual generators/renderers/playback and authored Phase 2 content are preserved.
- Database: `supabase/migrations/0005_close_ai_core.sql`, `0006_close_ai_controls.sql`, `seed-demo.sql`, demo seed generator, disposable local stack/bootstrap and compatibility fixture.
- Verification/operations: backend, account-browser and logic tests; test build/start/gateway scripts; existing demo browser suite explicitly selects demo; CI integration job, environment example and setup/architecture/privacy/decision documentation.

## Final A–K review

A. **Repository:** working Phase 2 UI retained, with additive server/database adapters.
B. **Database:** reproducible additive migrations, fictional seed, owner relations and resource lifecycle records.
C. **Authentication:** local real signup/signin/signout/session and protected routes verified; hosted confirmation-email delivery unverified.
D. **Authorization:** RLS, verified session ownership and campus resource roles; staff gain no private student access.
E. **Resources:** database directory/details, checked verification, edit downgrade, internal review history and persistent DEMO labeling.
F. **Student persistence:** profile/preferences, saves, plans/steps, consent, reminder intent and minimal optional learning data.
G. **Demo:** bilingual local mock/visual learning/offline flows retained and tested; no silent account import.
H. **Security:** two-user/staff boundary, input/CSRF, ownership, consent, no private offline cache, secret-reference checks.
I. **Tests:** exact executed commands/results recorded above; hosted management check returned 401.
J. **Limits:** hosted configuration, email confirmation delivery, full Auth deletion, large-corpus pagination/streamed export and external integrations remain as documented.
K. **Phase 4 readiness:** locally verified core is reviewable; hosted prerequisites are unverified. Phase 4 has not started.
