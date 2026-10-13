# Close AI

Student support first, with optional Academic Study, Developer Path, Visual Learning and CP manual progress. The application lives in [`apps/web`](apps/web): Next.js + Supabase Auth/PostgreSQL/RLS, with a separate bilingual fictional demo.

```bash
cd apps/web
npm ci
npm run dev
```

Default demo mode needs no credentials. For persistent accounts, follow [Supabase setup and checks](apps/web/README.md). All seeded campus support records are fictional and marked **DEMO**. Production AI, Codeforces integration and notification delivery are later work; chat is still a deterministic mock.

Phase 1 planning is preserved in [`close-ai-phase1`](close-ai-phase1). [Phase 2 verification](close-ai-phase1/docs/PHASE_2_REPORT.md) and the [Phase 3 implementation report](PHASE_3_REPORT.md) describe actual behavior, tests and remaining deployment limits. The older FastAPI service is retained in `apps/api` but is not called by Close AI.

Database migrations in [`supabase/migrations`](supabase/migrations) adapt the existing schema without replacing historical migrations. Review the legacy grant changes before applying them to a shared older deployment. Current [architecture](docs/ARCHITECTURE.md), [privacy](docs/PRIVACY_AND_SAFETY.md) and [decisions](docs/DECISIONS.md) document the implemented boundaries.
