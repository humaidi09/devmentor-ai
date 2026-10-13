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

### Phase 4: grounded support chat

Account chat searches the signed-in user's selected campus with PostgreSQL full-text relevance and strict verification/date filters. Set server-only `AI_PROVIDER=gemini`, `AI_MODEL` and `AI_API_KEY` (or the existing `GEMINI_API_KEY` binding). Default `mock` works without a key; Demo always uses fictional local data. Account mock uses database resources, not demo constants. Students explicitly choose to send the current message and up to three resource summaries to Gemini. No conversation history, profile or learning records are sent.

The model returns only selected resource IDs and allowlisted checklist keys. The server validates them and renders stored facts, canonical source URLs and missing-information warnings. It has no database tools, messaging tools or write permissions. Review/edit/reject checklist drafts; **Approve and save** requires storage consent and saves atomically. No reminder is created. Chat is memory-only and can be cleared. Provider failure leaves directory, saved resources, next steps and human support available.

Run `npm run test:logic`, `npm run test:backend`, `node tests/ai-backend.cjs` with the documented local stack; `node tests/ai-browser.cjs` against the account test server. `npx tsx tests/ai-live.ts` is a separate, explicit real-provider smoke test using fictional public context; it is excluded from CI. Run `npm run typecheck`, `npm run lint`, default and account builds. Apply migration `0007` before account chat.
