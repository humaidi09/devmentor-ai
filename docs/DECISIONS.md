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
