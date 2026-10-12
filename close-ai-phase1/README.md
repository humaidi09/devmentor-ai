# Close AI — Phase 1 Planning Package

**Tagline:** From student barriers to real support.

## Status
Phase 1 planning documentation is complete. This directory preserves the planning package; the actual Next.js implementation now lives in `apps/web` and has been inspected. See [Phase 2 report](docs/PHASE_2_REPORT.md) for current implementation and validation.

## Implementation choices
The frontend keeps the existing deep-teal direction, full Bangla/English UI, and a six-topic Visual Learning prototype. Demo University is fictional; no real pilot campus has been selected or verified. Production login and real-campus rollout decisions remain open. These are implementation defaults, not a record of formal institutional approval.

## Recommended MVP architecture
- **Frontend + server:** Next.js + TypeScript using the App Router and server-side Route Handlers / server actions where appropriate.
- **Styling/components:** Tailwind CSS + accessible component primitives.
- **Database/auth:** Supabase PostgreSQL + Supabase Auth + Row Level Security.
- **AI:** provider abstraction behind server-side endpoints, with a complete mock/demo provider when no API key is configured.
- **Search:** PostgreSQL full-text search for verified resources in MVP.
- **Visual Learning Lab:** reusable step generators + renderer components rather than prerecorded videos.

This architecture is intentionally simple for an MVP. A separate FastAPI service should be introduced only when a proven backend requirement justifies the extra deployment and maintenance boundary.

## Product priorities
### Must have
Student Support chat, verified resource directory, resource details, human handoff, My Next Steps, consent/privacy controls, demo mode, responsive/accessibility basics, Bangla/English support.

### Should have
Saved resources, reminders, basic Academic Study, Developer Path, CP Coach, and a small Visual Learning Lab prototype.

### Later
Advanced personalization, external university integrations, full Codeforces personalization, push notifications, advanced analytics, large visualization library, additional CSE subjects, complex agent systems, and vector databases unless justified.

## Phase 1 documents
- `docs/PRODUCT_SCOPE.md`
- `docs/USER_JOURNEYS.md`
- `docs/INFORMATION_ARCHITECTURE.md`
- `docs/PAGE_MAP.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/VISUAL_LEARNING_LAB.md`
- `docs/RESOURCE_LIFECYCLE.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY_AND_SAFETY.md`
- `docs/ACCESSIBILITY.md`
- `docs/DECISIONS.md`
- `docs/FAILURE_AND_EDGE_CASES.md`
- `docs/PHASE_1_REVIEW.md`

## Phase 2 gate
The original implementation gate is retained in the historical review. Repository inspection has now occurred and Phase 2 demo implementation and local validation are complete; real-campus scope and production login remain decisions for the next phase.
