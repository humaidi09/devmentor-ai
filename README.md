# Close AI

Student support first: fictional campus-resource discovery, student-controlled next steps, and optional learning modules. The current app is a **Phase 2 frontend demo**, not a production campus service.

The Next.js application is in [`apps/web`](apps/web). Run commands there, not at the repository root. It needs no Supabase or AI credentials. All campus contacts/resources are fictional and visibly labeled. The older `apps/api` FastAPI service is not used by this frontend.

```bash
cd apps/web
npm ci
npm run dev
```

See [web setup and validation](apps/web/README.md), [Phase 1 planning](close-ai-phase1/README.md), and the [Phase 2 implementation report](close-ai-phase1/docs/PHASE_2_REPORT.md).

Phase 1 planning is complete. Phase 2 includes onboarding, bilingual support/resource flows, settings, local saved resources, study/developer/CP prototypes, six interactive learning topics, and offline support for public demo pages. Production auth, per-user database authorization, live AI, real campus verification/maintainer operations, and external reminders are later-phase work.
