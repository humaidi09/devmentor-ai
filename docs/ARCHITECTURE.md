# Close AI implemented architecture

Close AI uses the existing Next.js application in `apps/web` as its server and frontend. The earlier FastAPI/DevMentor service is retained in the repository but is not called by this app. Historical Phase 1 rationale is in `close-ai-phase1/docs/ARCHITECTURE.md`; current implementation and validation are in `PHASE_3_REPORT.md`, `PHASE_4_REPORT.md` and `PHASE_5_REPORT.md`.

Browser → same-origin Next.js routes → Supabase Auth/PostgREST → PostgreSQL RLS. `@supabase/ssr` maintains cookie sessions; middleware refreshes them and `getUser` verifies the identity. Private API handlers repeat verification and derive ownership from the verified user. They carry the user's session to PostgREST; no service-role client is used.

`lib/account` holds transient account UI data and explicit write outcomes; `lib/resources` supplies the selected campus directory. Demo providers retain the original local data paths. Server routes validate strict allowlists, IDs, enums, HTTPS sources and times. Mutations require the canonical request origin. `CLOSE_AI_SITE_URL` can fix the trusted origin behind a reverse proxy and must match the deployment using it.

Profiles/module preferences are separate from private support saves/plans and optional learning tables. Composite foreign keys prevent attaching another user's plan/step/course. RLS is mandatory on every table. Resource staff roles are campus-scoped, assigned by a SQL operator, and grant no access to other students' data.

Resource changes use guard/audit triggers. Reviewers need checked evidence to verify; edits invalidate old verification. Students read published lifecycle states, while never-published drafts/review submissions and internal review notes remain restricted. The frontend downgrades a verified record whose review/deadline has elapsed to an expired display without claiming a scheduler updated the stored state.

Support conversations are not stored. Visual algorithms and explanations remain deterministic local definitions. Service-worker cache is limited to demonstrably public fictional pages/assets; account mode removes it and private responses use no-store.

Migrations 0001–0004 are preserved; 0005–0006 adapt the actual existing schema. Legacy client grants on unused private tables are revoked. This compatibility boundary matters before applying migrations to an old shared deployment.

## Phase 4 support flow

`POST /api/chat` -> same-origin account session -> selected campus -> lightweight EN/Bangla intent/safety routing -> invoker-security PostgreSQL search -> current/verified filtering and transparent category/campus/relevance ranking -> mock or server-only Gemini provider -> strict ID/step validation -> controlled response renderer. Maximum three sources; no embeddings. Retrieved text is untrusted JSON data, separated from system instructions. Only the current message, language and small public summaries enter the provider. Unknown category/campus asks one optional clarification, then allows directory/human fallback.

Model output cannot supply prose facts, URLs, SQL, tools or mutations. `/api/plans/draft` is a separate authenticated student action with explicit confirmation, storage consent, a retry token and a transactional invoker RPC. Chat stays transient; existing private conversation tables remain inaccessible to students/maintainers. `integration_usage` stores only per-user service/hour counters with own-row SELECT and a narrow consume RPC (20 AI requests/hour). No provider payload logging.

## Phase 5 integrations and reminders

The existing `notifications` and `reminders` tables are reused. New own-row `notification_preferences` controls in-app/category/preview/quiet-hour choices; timezone/quiet times remain in `profiles`. Students can only read/delete notifications and update `read_at`; content insertion belongs to a narrow database scheduler. Approval-token scheduling and composite step/deadline ownership are enforced transactionally. Notifications/reminders remain separate from resource staff permissions.

`POST /api/notifications` verifies user/origin and calls the user-scoped `deliver_close_ai_reminders()` with no caller-supplied actor or clock. A visible, online signed-in app polls every 60 seconds; the center also has a manual check. The RPC locks due rows, respects consent/module/category/quiet-hour settings, deduplicates occurrences and advances daily/weekly schedules in their stored IANA timezone. It consolidates missed recurrences rather than sending a burst. Support previews are always generic. No remote scheduler, email provider or push subscription is implied.

Codeforces adapter: official HTTPS response -> bounded JSON reader -> strict normalized public profile/problem/submission models -> CP Coach. Per-process TTL/LRU-bounded cache and single-flight requests reduce calls; 2.1-second outbound spacing and durable 30-request/hour/user budgets bound use. No automatic retries. Preview is read-only; confirm revalidates and appends optional-profile consent before storing only a handle/time in `cp_preferences`. The timestamp records the user's connection preference, not a resource-verification trust grant. Disconnect clears identifiers and cache entries. No external secret is needed.

`learning_progress` owns explicit visual/project choices; CP uses the existing manual progress table. Pure recommendation functions accept only explicit learning inputs, never support transcripts/profiles. Academic drafts are rule-based and labelled as such, saved only on approval, and editable/reschedulable afterward. Export/reset include new user data. Visual animations remain independent of providers. Local Inter/Noto Sans Bengali/JetBrains Mono assets preserve typography, include OFL licenses and recorded source/hash provenance, and remove build-time Google Fonts dependency.
