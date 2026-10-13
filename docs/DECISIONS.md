# Close AI Phase 3 decisions

1. Keep the working Phase 2 design, components, Bangla copy, mock chat and Visual Learning definitions. Add database adapters and an explicit demo/account boundary.
2. Use Next.js route handlers with Supabase Auth/SSR and user-scoped PostgREST. No FastAPI, service-role client or external AI is introduced.
3. Preserve migrations 0001–0004 and adapt them additively. Reuse profiles/courses/deadlines/CP preferences; revoke unused legacy private-table client access. Review the impact before applying to a shared old application.
4. Use campus-scoped resource roles assigned through trusted SQL. Staff roles never inherit personal student-data permissions. Verified edits return to review; DEMO markers cannot be stripped.
5. Use per-user composite keys for plan/step/reminder/course ownership. Enforce consent at database boundaries and audit reminder changes even for direct writes.
6. Keep demo browser data separate from account data. Never silently import demo saves/plans into a real account. Account responses are not cached offline.
7. Persist reminder intent and manual learning progress only. External AI, Codeforces synchronization, email/push delivery, analytics and agent systems remain later work.
8. Provide export and confirmed app-data reset. Full Auth-account deletion stays clearly operator-assisted until safe reauthentication/admin deletion is implemented.
9. Use a disposable local PostgreSQL + actual GoTrue + PostgREST stack for reproducible auth and RLS tests; do not declare hosted deployment verified without valid hosted credentials.

## Phase 4 decisions

- Prefer controlled/extractive resource facts over unrestricted model prose: validation can prove IDs and actions are grounded, while a model still selects relevance and checklist ordering. This intentionally limits open-ended chat.
- PostgreSQL category/campus/date filtering plus full-text rank suffices for MVP; no vector store or microservice.
- Keep chats transient and legacy chat client grants revoked. Private learning/profile fields never enter prompts.
- Mock account chat retrieves real DB resources; Demo remains explicitly fictional, including offline. Account offline shows retry/manual routes rather than substituting fictional data.
- Gemini is isolated behind `AiProvider`; server-only configuration and HTTP adapter preserve managed proxy/CA trust. Students opt in per message. Model availability can change independently of model-list success.
- Draft saves are explicit, consent guarded, transactional and idempotent. Budget counters are operational metadata only; no unrestricted model tools.

## Phase 5 decisions

- In-app delivery is the MUST scope. Email/push need a configured provider and separate opt-in; neither is implemented or shown as a connected service. No Phase 6 production jobs/deployment are started.
- Reuse reminders/notifications/CP preference and progress tables. Add only notification preferences and optional explicit visual/project progress. Keep all user data under RLS; staff permissions remain resource-only.
- Deliver at app-open/visible polling, with a user-scoped database RPC using server time, row locks and occurrence dedupe. This gives functional in-app reminders without a privileged service-role web client. Document that off-app delivery is absent.
- Daily/weekly recurrence preserves local wall-clock time across DST. Nonexistent initial local times are rejected; ambiguous repeated initial times use PostgreSQL's standard-time occurrence. Equal quiet-hour times mean all-day quiet. Missed recurrences consolidate to one.
- Treat Codeforces as an optional public integration with a fixed official destination, typed normalization, response size limits, short TTLs, single-flight/throttle and bounded requests. Do not create a generic external URL proxy or store raw remote data.
- Keep a connected handle/time as private preference data, never staff/student-visible by default. Preview then confirm; consent withdrawal/disconnect clears the identifier. No Codeforces secret or extra integration table is needed.
- Keep learning suggestions deterministic and transparent instead of exporting private learning records to another model. Explicit visual/project progress can be edited/deleted; no automatic completion or hidden scores. Preserve the six existing visual engines.
- Bundle the approved fonts locally with OFL licenses/provenance after Google's CSS URL format exposed a Next.js font-loader parser failure. This preserves font families and makes builds independent of remote font availability.
