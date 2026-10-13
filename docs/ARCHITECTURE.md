# Close AI implemented architecture

Close AI uses the existing Next.js application in `apps/web` as its server and frontend. The earlier FastAPI/DevMentor service is retained in the repository but is not called by this app. Historical Phase 1 rationale is in `close-ai-phase1/docs/ARCHITECTURE.md`; current implementation and validation are in `PHASE_3_REPORT.md`.

Browser → same-origin Next.js routes → Supabase Auth/PostgREST → PostgreSQL RLS. `@supabase/ssr` maintains cookie sessions; middleware refreshes them and `getUser` verifies the identity. Private API handlers repeat verification and derive ownership from the verified user. They carry the user's session to PostgREST; no service-role client is used.

`lib/account` holds transient account UI data and explicit write outcomes; `lib/resources` supplies the selected campus directory. Demo providers retain the original local data paths. Server routes validate strict allowlists, IDs, enums, HTTPS sources and times. Mutations require the canonical request origin. `CLOSE_AI_SITE_URL` can fix the trusted origin behind a reverse proxy and must match the deployment using it.

Profiles/module preferences are separate from private support saves/plans and optional learning tables. Composite foreign keys prevent attaching another user's plan/step/course. RLS is mandatory on every table. Resource staff roles are campus-scoped, assigned by a SQL operator, and grant no access to other students' data.

Resource changes use guard/audit triggers. Reviewers need checked evidence to verify; edits invalidate old verification. Students read published lifecycle states, while never-published drafts/review submissions and internal review notes remain restricted. The frontend downgrades a verified record whose review/deadline has elapsed to an expired display without claiming a scheduler updated the stored state.

Sensitive mock conversations are not stored. Visual algorithms and explanations remain deterministic local definitions. Service-worker cache is limited to demonstrably public fictional pages/assets; account mode removes it and private responses use no-store.

Migrations 0001–0004 are preserved; 0005–0006 adapt the actual existing schema. Legacy client grants on unused private tables are revoked. This compatibility boundary matters before applying migrations to an old shared deployment.
