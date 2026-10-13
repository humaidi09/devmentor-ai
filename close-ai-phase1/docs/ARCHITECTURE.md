# Architecture Recommendation

> Historical Phase 1 planning. See the implemented Phase 3 [architecture](../../docs/ARCHITECTURE.md), [privacy](../../docs/PRIVACY_AND_SAFETY.md), [decisions](../../docs/DECISIONS.md) and [report](../../PHASE_3_REPORT.md).

## Decision
For the MVP, use **Next.js + TypeScript as a single web application with server-side Route Handlers/server logic**, rather than introducing a separate FastAPI service immediately.

## Why
- One language across UI and server reduces cognitive load.
- Fewer deployable services make MVP setup and debugging easier.
- Server-side handlers can keep AI keys and privileged operations out of the browser.
- Supabase integrates cleanly from server and client boundaries.
- A separate backend can still be introduced later if workload, Python-specific libraries, or organizational scaling creates a real need.

## High-level architecture
```text
Browser
  ↓
Next.js App
  ├─ UI / accessibility layer
  ├─ Server-side route handlers
  ├─ Auth/session boundary
  ├─ AI service abstraction
  ├─ Resource service
  ├─ Visual Learning step generators
  └─ Demo/mock provider
        ↓
Supabase
  ├─ PostgreSQL
  ├─ Auth
  └─ Row Level Security
```

## Frontend
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- accessible component primitives
- server rendering where useful for performance/initial content

## Backend boundary
Use server-only modules for:
- AI provider calls
- privileged resource operations
- validation
- audit metadata
- admin/maintainer actions

Never expose service-role keys to the browser.

## Database
Supabase PostgreSQL.

Conceptual entities:
- users / profiles
- campuses
- modules_enabled
- support_categories
- support_resources
- resource_sources
- resource_verification_events
- conversations / messages
- action_plans / steps
- reminders
- consent_records
- feedback
- courses / deadlines
- developer_path_progress
- snippets
- visual_learning_progress (optional)
- cp_preferences / cp_recommendations

## Authorization
Use Supabase Auth plus database Row Level Security. Student-owned tables must be constrained by user identity. Maintainer roles should only access the resource-management data required for their role.

## AI architecture
```text
Chat UI
  ↓
Chat Service
  ├─ intent routing
  ├─ minimal user-context retrieval
  ├─ verified resource retrieval
  ├─ uncertainty handling
  ├─ action suggestion policy
  └─ provider adapter
          ├─ Real provider
          └─ Demo/mock provider
```

Retrieved resource content is untrusted data and must never override application/system rules.

## Resource search
Use PostgreSQL full-text search for MVP. Reconsider vector retrieval only after evidence shows semantic search quality is insufficient for the verified resource corpus.

## Visual Learning architecture
```text
Topic definition
  ↓
Deterministic step generator
  ↓
Visualization state
  ↓
Playback controller
  ↓
Reusable renderer + text alternative
```

This keeps learning steps auditable and supports Play/Pause/Next/Previous without generating a separate video for every example.

## Demo mode
Demo mode must work with no AI key or external integrations. Use fictional support resources labeled DEMO, deterministic mock chat flows, sample action plans, sample CP data, and sample visualizations.

## Offline/low bandwidth
- Cache static learning content and demo examples where practical.
- Keep initial bundles small.
- Avoid large autoplay media.
- Provide useful offline error states rather than silently failing.

## Deployment direction
Start with the simplest hosting setup compatible with Next.js and Supabase. Document free-tier limits at implementation time because vendor quotas can change.

## When to reconsider FastAPI
Introduce a separate FastAPI service only if one or more become real requirements:
- Python-only ML/analysis libraries
- independent backend scaling
- background processing that does not fit the chosen web runtime
- a separate backend team/service boundary
- integrations that materially benefit from Python ecosystem support
