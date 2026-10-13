# Phase 4 — AI & Resource Grounding

## Repository status / A. Architecture

Built on the unmerged Phase 3 branch/PR, preserving the approved bilingual UI and deterministic six-topic Visual Lab. Phase 3 already had Next.js server routes, Supabase cookie authentication, user-owned RLS, consent-guarded saved resources/plans, resource verification roles and fictional Demo Mode. The former chat returned demo constants even in account mode. No hosted database was changed.

## B. AI integration / C. Grounding

Server-only interchangeable mock/Gemini providers, strict response schema and post-generation validation. Account chat retrieves a maximum of five PostgreSQL full-text/category/campus matches and exposes up to three current verified sources. Ranking uses explicit campus, category and message relevance. No vectors. Models choose existing IDs and allowlisted step keys; stored facts and URLs are rendered by the server. Missing eligibility, cost or contact is explicitly unknown. Expired/unverified/draft/other-campus resources are excluded.

The tested default is `gemini-3.1-flash-lite-preview`, configurable with `AI_MODEL`. A real generation request using a fictional tuition resource passed structured validation (one resource, two checklist steps). Model-list access alone proved insufficient: `gemini-2.5-flash` returned 404, and the unpinned latest alias returned 503. The real test stays opt-in, separate from CI and never includes actual student information. Preview model availability is an operational limitation.

## D. Safety / E. Human handoff

Lightweight EN/Bangla category and learning-module routing; one optional clarification, Prefer not to say and immediate human support. High-risk/professional messages cannot produce decisions or checklists. Emergency wording contains no invented numbers. Human contacts remain directory-authored with source and verification dates. The existing editable advisor-message draft is retained; nothing sends messages. Retrieved text is untrusted JSON, separate from instructions. Invalid IDs, URLs, actions, SQL/tools and extra model fields fail closed. The classifier is limited keyword routing, not diagnosis or comprehensive crisis detection.

## F. Action plans

Editable/deletable/rejectable drafts remain unsaved until **Approve and save**. Both storage consent and explicit confirmation are required by the server and database. The transactional save RPC accepts a retry token, prevents duplicates, rolls back invalid partial drafts and respects user RLS. No automatic reminder. Demo saves only approved sample steps to browser session storage; account saves use Supabase.

## G. Privacy

Conversations remain memory-only with Clear conversation. Existing private chat tables remain inaccessible to students, maintainers and reviewers. Per-message external AI opt-in sends only the current message, language and small resource summaries; no profile, transcript history, saved data or learning history. No prompt/content logging. Durable hourly usage counters contain only opaque user/service/time/count metadata; users cannot edit/reset them. AI keys and service-role keys are absent from client bundles. Google retention depends on provider terms; this is distinct from Close AI storage.

## H. Demo / fallback

Default mock works with no AI key. Demo always remains fictional/local even when keys exist; account mock uses database resources. Offline demo chat remains available. Account offline shows error/Retry without substituting fictional resources. Provider failure preserves manual directory, saved resources, steps and human routes. No Codeforces changes in this phase. Visual Lab still works without AI.

## I. Tests actually run

- Baseline `npm install`, typecheck, 19 existing logic tests, default production build and real local Supabase auth/RLS suite passed before implementation.
- Final logic suite: **26 passed, 0 failed** (grounding, stale/wrong-campus data, missing facts, malicious output, restricted actions, injection isolation, provider failures, urgent routing and clarification limits).
- Typecheck and lint passed; default and account production builds passed.
- Real local Supabase backend auth/RLS suite passed, plus `ai-backend.cjs`: verified retrieval, consent/approval, rollback, retry idempotency, owner isolation, no automatic reminder and durable budgets.
- `ai-browser.cjs`: auth/CSRF/input rejection, account DB resources, editing and explicitly saving a draft, offline/retry, WCAG axe and 360px layout passed.
- Existing account browser suite passed (signup/signin/signout, persistence, staff/student separation, six route accessibility/mobile checks, no private offline cache).
- Existing 20-route demo browser suite passed (English/Bangla, mobile/WCAG, visual controls, API error fallback and offline reload/chat).
- Static scan: **46 client bundles** contained no AI/service-role secret binding names or configured secret values.
- Real Gemini generation and strict validation passed with fictional context. Hosted Supabase Management API remains **401**; hosted auth/RLS/migration verification was not run.

## J. Known limitations / K. Phase 5 readiness

Implementation and local security/UI gates passed; ready to implement the supplied Phase 5 prompt. This is not a production-deployment claim. Hosted Supabase credentials need correction and migration 0007 needs operator application in the intended project before live account features can work. Preview models may change; provider failures remain visible and manual fallback stays usable. No persistent chat, automated contact, unrestricted tools, external notifications, Codeforces or Phase 6 deployment was added. Both Phase 4 and Phase 5 prompts were supplied together, authorizing continuation after the Phase 4 gate.
