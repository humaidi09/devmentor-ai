# Phase 5 — Optional Integrations & Personalization

## Repository status / A. Integration summary

Stacked on Phase 4 (`eea8d31`, PR #4), which itself follows Phase 3/2. The approved Next.js/Supabase architecture and bilingual design remain. Before Phase 5, local auth/RLS, consent, verified resource grounding, provider validation, atomic draft saves, demo/offline behavior and real Gemini generation passed. Phase 4's three GitHub CI jobs also passed. No critical Phase 4 security failure was bypassed.

Implemented the Phase 5 MUST items: Notification Center, persisted notification preferences, functional in-app reminder engine, timezone/quiet-hour handling, manual CP improvements, isolated validated Codeforces adapter and safe failures. Added public profile/history/problem integration and transparent Academic/Developer/Visual personalization. The older FastAPI service is retained but not called by Close AI. No new microservice, service-role web client, hidden student scores or Phase 6 deployment was added.

## B. Notifications

Reuse existing notifications/reminders; add own-row notification preferences. In-app notifications default off and append consent evidence. Master Reminders and each schedule are separate explicit choices. Create an approved once/daily/weekly reminder, optionally attach an owned Support step or Academic deadline, or choose CP/Developer practice. Approval tokens make creation retry safe. Cross-user step/deadline parents are prohibited by composite foreign keys.

Visible online signed-in pages check due reminders every 60 seconds; the center supports manual checking. The database RPC uses its own actor/clock, locks rows, deduplicates occurrences, respects master/module/category/quiet-hour settings and advances recurrence in the schedule's IANA timezone. Missed recurring reminders consolidate to one. Completed/not-relevant steps and completed/cancelled deadlines stop associated delivery. Equal quiet times mean all-day quiet; nonexistent initial DST local times are rejected, repeated times use PostgreSQL's standard-time occurrence.

Read/unread, mark all read, dismiss, disable and delete work. Notification content cannot be forged through student table grants: clients can read/delete and update only read_at. Support previews always use generic text, even if learning-detail previews are enabled. No off-app scheduler, email, push, SMS or third-party message delivery is configured. An existing unscheduled reminder intent needs a separately approved date/time before delivery.

## C. Codeforces integration

Optional preview -> public normalized profile -> explicit identifier-storage consent/confirmation -> save private handle/connection time. Preview never persists an identifier; confirmation revalidates the public profile. Settings Connected Services displays only the implemented Codeforces service. Disconnect and optional-profile consent withdrawal clear identifiers, connection time and relevant public cache entries. The recorded connection timestamp is a student preference, not a privileged resource-verification grant.

The official HTTPS destination is fixed. Adapter validates response status, arrays, IDs, handle, strings and numeric fields; constructs canonical URLs; caps raw JSON at 4 MB and returns only necessary normalized public data. No private Codeforces access is claimed. Profile cache 5 minutes, recent 50-submission sample 2 minutes, topic-filtered public problem metadata 30 minutes; cache bounded to 64 server-process entries with single-flight requests. Outbound throttle 2.1 seconds plus durable 30-request/hour/user allowance, no automatic retries. Public data is loaded only on request; no support/profile/learning transcript is sent.

Actual real requests passed: public profile, **50 submissions**, and topic-filtered problem metadata. A real Next.js browser flow verified preview, consent/confirm, private DB persistence across reload and disconnect through Settings. CI uses deterministic fixtures and separate actual database consent/RLS tests; it does not depend on Codeforces availability.

## D. CP Coach improvements

Manual curated public catalog, topic/rating/difficulty/random practice, evidence-based weak topics from actual Attempted/Need Hint records, optional public-data practice and accepted-problem exclusion. No fabricated rating analytics or improvement guarantees. Persisted statuses: Attempted, Solved, Skipped, Need Hint, Upsolved (and clear). Hint 1 -> optional Hint 2 -> related supported visualization links; no automatic full solution. Showing hints preserves an existing Need Hint record. Completed practice remains viewable/undoable. Integration failure leaves the manual catalog, hints and concept links usable; account progress saving requires a connection.

## E. Academic Study personalization

Rule-based, clearly labelled editable/rejectable drafts use only the student's pending deadlines and unfinished tasks. No external AI receives learning records. A student may edit a title/time, approve it, then edit or reschedule the saved task. Nothing automatically rewrites a schedule. Deadline and study/CP reminder links require separate explicit approval and consent. Courses/tasks/deadlines remain private and user-controlled; course-concept links lead to the independent Visual Lab.

## F. Developer Path personalization

Transparent recommendation: the first unfinished milestone in the chosen pathway, with earlier prerequisite and a practice-project idea. Existing completed milestones persist. Explicit project states: Planned, Started, In Progress, Completed, Paused; user can remove the record. No automatic completion or job-readiness claim.

## G. Visual Learning enhancements

The six approved engines remain independent of AI/external services. Optional Remember this step and Mark learning completed actions store only student-selected progress. Recent/continue links restore a remembered step; related concepts and CP return links stay deterministic. Forget progress removes it. No automatic viewing tracker. Demo progress stays in scoped browser session data; account progress uses own-row RLS.

Approved Inter/Noto Sans Bengali/JetBrains Mono fonts are now local, with OFL licenses and HTTPS source/hash provenance. This fixes a real Next.js Google Fonts URL parser build failure while preserving typography and removing build-time font-network dependency.

## H. Privacy and consent

Support transcripts remain transient and are excluded from unrelated recommendations and external integrations. No protected attributes, mental-health/dropout scores or private performance analytics are created. Account data uses private/no-store and is excluded from demo offline cache. Export/reset include new notification preferences, notifications, schedules, connection identifiers and explicit learning progress. Operational opaque user/service/hour counters contain no message or handle and remain outside app-data reset to prevent quota bypass; Auth deletion cascades them. Full Auth-account deletion remains visibly operator-assisted.

All new tables have RLS. Resource staff permissions remain campus resource-only and grant no private student access. Bounded request parsing rejects oversized/malformed bodies even without Content-Length. AI validation also rechecks resource freshness after provider latency and professional routing uses relevant/general human categories.

## I. Failure / offline behavior

Codeforces invalid/offline/rate-limited/partial/malformed/oversized responses fail safely and do not silently save identifiers. AI failures retain manual resource/human routes. Demo remains fictional/local with no external calls. Visual engines and loaded manual hints remain usable without providers. Offline account mutations report failure and never pretend to persist. In-app notifications have no off-app guarantee; quiet-hour delivery waits until an eligible open-app check.

## J. Security testing

Actual local GoTrue + PostgreSQL + PostgREST, fresh migrations 0001–0009, multi-user ownership/RLS tests, CSRF/session checks, consent withdrawal, transactional reset, approval/idempotency, reminder source ownership, content-write grant restrictions, AI budgets, private staff/chat separation and direct database rejection tests passed. Resource verification guards and grounding remained intact. Client secret scans passed. These are implementation security checks, not a final production security audit.

## K. Tests actually run

- Clean `npm ci`, typecheck, lint, **36 logic tests passed / 0 failed**, default and account production builds.
- Original local auth/RLS backend suite, Phase 4 grounding/draft/budget suite and new Phase 5 notification/learning/connection-consent backend suite passed after fresh migrations.
- Reminder tests: approval/consent, retry dedupe, due once/daily/weekly, DST local-time recurrence, quiet/disabled/category gates, generic previews, read/unread/delete, wrong-user denial and data-reset isolation.
- Adapter tests: valid/invalid/empty/malformed/mismatched profile, normalized problem/submission sample, offline/429/oversize/invalid JSON, cache expiry/invalidation/throttle/single-flight.
- Personalization tests: explicit deadline/task/milestone/practice/visual inputs, no invented weak topics and deterministic related concepts.
- Phase 5 browser suite passed: preferences, approved due reminder/read/dismiss, editable approved study tasks/rescheduling, manual project progress, explicit remembered step + resume, invalid handles/failure, CP persistence, export and six updated routes in **English and Bangla**, WCAG axe and 360px layout. Fixture preview is clearly identified; real connection is separate.
- Real Codeforces adapter smoke and separate real local-account browser connect/reload/disconnect flow passed.
- Original account browser regression suite and Phase 4 chat auth/CSRF/grounding/approval/offline/retry/axe/mobile suite passed.
- Original **20-route bilingual demo browser suite** passed, including responsive/WCAG checks, keyboard/visual controls, API error fallback, offline reload/chat, API cache exclusion and scoped data clearing.
- **51 client bundles** contained no AI/service-role secret binding names or configured secret values.
- Phase 4 real Gemini generation had passed with fictional context; final CI/browser tests keep AI mock. Hosted Supabase Management API still returned 401; hosted migrations/auth/RLS were not tested or applied.

## L. Known limitations

No configured email/push provider, remote background delivery job, resource-verification broadcasts, LMS/university calendar integration or additional visual topics. These are deferred priorities; no placeholder connected service is shown. CP hints and learning drafts are intentionally deterministic; public history is a limited sample and raw remote data is not stored. Per-process public caching/throttle is complemented by durable user limits; it is not a distributed global API queue. Changing a recurrence timezone requires creating an explicitly approved replacement; existing schedules retain their timezone.

Hosted Supabase authorization must be repaired and migrations applied to the intended project before live account features can be verified. Configure canonical site URL/Auth redirects, explicit account flags and optional server-only AI credentials/model. The tested Gemini model is a preview and can change availability. Existing seeded campus services are fictional; production resource governance and verified real contacts remain operator responsibilities. All stacked PRs remain unmerged; no final production deployment is claimed.

## M. Phase 6 readiness

Phase 5 core implementation/local review gates passed; ready for explicit Phase 6 final-testing/pilot preparation after hosted configuration and staged PR review. This is not a production-readiness or pilot-completion claim. Phase 6 production deployment, large-user tests, final audit and monitoring were not started.

Reusable cloud install/start instructions and non-secret AI defaults were saved in the environment draft. To use that saved setup in new sessions, review/save it in environment settings and publish the cloud environment. Draft saving does not deploy the website or verify a newly restored machine.
