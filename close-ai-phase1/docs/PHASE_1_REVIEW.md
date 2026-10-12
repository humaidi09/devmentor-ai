# Phase 1 Review

## A. Product summary
Close AI is a student-support workspace that helps a student state a barrier, locate verified campus support, understand next steps, and reach a human when appropriate. Optional learning modules remain separate from this primary support experience.

## B. MVP scope
### Must
Student Support chat, verified resource directory/details, source/verification state, human handoff, next-step tracker, consent/privacy, demo mode, mobile/accessibility basics, Bangla/English.

### Should
Saved resources, reminders, Academic Study shell, Developer Path shell, CP tracking, Visual Learning prototype.

### Later
Advanced personalization, integrations, large animation library, extra CSE subjects, advanced analytics, complex agents, vector DB unless evidence requires it.

## C. Core Student Support flow
Get Support → student states need → short clarification if necessary → verified resource retrieval → source + uncertainty → 1–3 next actions → student chooses save/checklist/human/continue.

## D. Module structure
- Student Support — primary
- Academic Study — optional
- Developer Path — optional
- Visual Learning Lab — inside Developer Path, reusable across CSE topics
- CP Coach — optional competitive-programming practice

## E. Visual Learning strategy
Use deterministic step generators and reusable renderers. Cover an initial small set such as BFS, DFS, Bubble Sort, Binary Search, SQL INNER JOIN, and normalization. Every visualization has text steps and manual controls.

## F. Resource verification
Lifecycle: Add → Review → Verify → Publish → Re-check → Update/Expire → Archive. Resource maintainer permissions are separated from student conversation access.

## G. Architecture recommendation
- Frontend/server: Next.js + TypeScript
- UI: Tailwind + accessible primitives
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Authorization: Row Level Security + server-side checks
- AI: provider adapter + demo/mock provider
- Search: PostgreSQL full-text + structured filters initially
- Visualizations: step generator → state → playback → renderer/text

## H. Privacy & safety
Minimum data collection, explicit consent for optional features, separate support vs learning data, no automatic third-party contact, no diagnosis/risk scoring, untrusted retrieval boundary, server-only secrets, minimal sensitive logging, deletion/export planning.

## I. Accessibility
Target WCAG 2.2. Core requirements: keyboard operation, visible focus, labels, status beyond colour, contrast, reduced motion, screen-reader-friendly chat, touch-friendly controls, and text alternatives for visual learning.

## J. Assumptions
1. The first release is a campus pilot.
2. No production repository was provided during Phase 1 execution.
3. No real campus resource dataset was provided, so no real support service is being asserted.
4. Demo data will be fictional and visibly labeled.
5. The MVP favors simple architecture over premature microservices.
6. Visual Learning begins with a small topic set rather than every DSA/DBMS topic at once.

## K. Open decisions requiring approval before Phase 2
1. **Pilot campus:** which university/campus is the first verified-resource scope?
2. **Brand colour:** approve or replace the provisional deep-teal direction.
3. **MVP learning scope:** confirm whether Visual Learning prototype is included in Phase 2 or follows the core Student Support frontend.
4. **Login method:** email/password, magic link, or other Supabase-supported approach to prioritize.
5. **Bangla strategy:** full UI translation in first MVP or bilingual chat first with UI translation shortly after.

## L. Phase 2 readiness
### Satisfied at planning level
- Product scope
- MVP priorities
- User contexts
- Main journeys
- Resource lifecycle
- Maintainer flow
- Information architecture
- Page map
- Visual direction
- Design tokens
- Visual Learning architecture
- Failure-state requirements
- User-control matrix
- Data classification
- Threat model
- Accessibility checklist
- Architecture recommendation
- Demo architecture
- Documentation package

### Blocking gate before coding
**Real repository inspection is still required.** No repository was supplied in this chat, so Phase 2 must not modify code until the actual repository is inspected.

## Final status
**Phase 1 documentation: COMPLETE WITH ONE IMPLEMENTATION GATE — repository inspection before Phase 2.**
