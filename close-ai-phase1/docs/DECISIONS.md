# Architecture & Product Decision Record

## D-001 — Student Support remains primary
**Decision:** Student Support is the visually dominant module.  
**Reason:** It defines the core product value: moving students from barriers to real support.  
**Alternative:** Equal-weight multi-tool dashboard.  
**Why not now:** It would dilute the main support journey.  
**Revisit when:** User research demonstrates a different primary use case.

## D-002 — Next.js server architecture for MVP
**Decision:** Use Next.js + TypeScript with server-side handlers rather than a separate FastAPI service initially.  
**Reason:** Lower operational complexity and one-language MVP.  
**Alternative:** Next.js + FastAPI.  
**Revisit when:** Python-specific processing, independent scaling, or backend team separation becomes necessary.

## D-003 — Supabase PostgreSQL + Auth + RLS
**Decision:** Use Supabase for relational data and authentication.  
**Reason:** Fits relational resource verification, per-user data, and an MVP-friendly auth/database boundary.  
**Alternative:** Separate database/auth providers.  
**Revisit when:** Scale, compliance, or infrastructure requirements exceed the chosen platform.

## D-004 — PostgreSQL search before vector DB
**Decision:** Start with full-text/filter search for verified resources.  
**Reason:** Resource corpus is structured and campus-scoped; simplicity is preferable until semantic retrieval is proven necessary.  
**Alternative:** Vector database.  
**Revisit when:** Search evaluation shows recurring relevant-result failures that structured/full-text search cannot solve.

## D-005 — Visual Learning Lab under Developer Path
**Decision:** Visual Learning Lab lives primarily under Developer Path.  
**Reason:** It covers DSA, algorithms, DBMS, and future CSE topics beyond competitive programming.  
**Alternative:** Place it entirely inside CP Coach.  
**Revisit when:** Product navigation research suggests students understand a different grouping better.

## D-006 — CP Coach remains distinct
**Decision:** CP Coach focuses on problem practice, hints, tracking, and upsolving; it deep-links to Visual Learning.  
**Reason:** Keeps contest practice separate from concept learning while allowing smooth transitions.  
**Alternative:** Merge both into one learning page.  
**Revisit when:** Usability testing indicates module switching causes friction.

## D-007 — Interactive deterministic visualizations, not video-only
**Decision:** Build visualizers from algorithm step generators and reusable renderers.  
**Reason:** Supports pause/back/forward, changed input, accessibility text, and consistent state.  
**Alternative:** Prerecorded videos.  
**Revisit when:** A topic cannot be meaningfully represented with interactive state and a video genuinely adds instructional value.

## D-008 — Resource maintainers do not inherit chat access
**Decision:** Resource permissions and student-support-data permissions are separate.  
**Reason:** Least privilege and privacy.  
**Alternative:** Broad admin role.  
**Revisit when:** Never by convenience alone; only under a documented role/access model with a justified operational need.
