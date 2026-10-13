# Close AI major feature upgrade — review report

Status: implemented and verified locally on 2026-10-13. This change is in the working tree for review; it has **not** been pushed or deployed to the hosted site. The current hosted demo therefore does not show this upgrade. Apply migration `0010_knowledge_cp.sql` before enabling account-mode saved knowledge or the extended CP progress states.

## What changed

- Human Support was removed from the primary navigation, landing pitch and routine assistant suggestions. The existing urgent/external-help route and safety handling remain available for genuinely urgent situations.
- Live Knowledge has a reusable server-side provider model (`apps/web/src/lib/knowledge/`) and search UI (`/knowledge`). Crossref supplies DOI/publication metadata, World Bank supplies supported country indicators, and GitHub supplies public repository metadata. Search selects providers by category/query, validates responses and source links, ranks results, caches public data for 10 minutes, labels stale fallback data for up to 24 hours, and isolates provider failures. A comparison view places provider excerpts side by side without inventing a conclusion; result cards expose original links, provider, source, publication and retrieval dates. No generated reliability percentages or fabricated results are used.
- Signed-in users can save/remove results into general, study, developer or CP collections. Demo saves are session-only. Study can turn a saved source into an editable task; Developer Path displays its saved sources. The optional source-backed Gemini explanation requires an account, a configured server-side key and an explicit consent checkbox. Its JSON findings must cite IDs from the exact public source set returned with the explanation. The UI labels it as an AI draft and links every cited source. Source metadata is evidence of a publication or repository, not proof that an AI interpretation is correct.
- CP Coach now has `/cp/library` and `/cp/topics/[topic]`, 23 topic categories, curated Codeforces/LeetCode references, live Codeforces public problem metadata where available, 20-item API pages, platform/topic/difficulty/rating/status/title filters, normalized difficulty with original ratings preserved, per-student status and attempt fields, hint-first cards, daily practice and a Learn → Visualize → Practice path. BFS/DFS and other supported concepts return from Visual Lab to the selected topic. Curated problem statements are never copied. Unknown ratings remain unknown.
- Dashboard, Study, Developer Path, Visual Lab and CP routes link the new features. Demo offline allowlist includes their public pages, while API and private account data remain outside offline caching.

## Main files and APIs

| Area | Files | Endpoint / data source |
| --- | --- | --- |
| Knowledge provider/validation/cache | `apps/web/src/lib/knowledge/{types,adapters,providers,core,engine,explain,explanation-schema}.ts` | Crossref `/works`, World Bank indicator API, GitHub repository search |
| Search, save and explanation | `apps/web/src/app/(app)/knowledge/page.tsx`, `apps/web/src/components/knowledge-collection.tsx`, `apps/web/src/app/api/knowledge/**` | `GET /api/knowledge`, `GET/POST/DELETE /api/knowledge/saved`, `GET/POST /api/knowledge/explain` |
| CP library and learning path | `apps/web/src/lib/cp/library.ts`, `apps/web/src/components/cp/problem-library.tsx`, `apps/web/src/app/(app)/cp/{library,topics}/`, `apps/web/src/app/api/cp/problems/route.ts` | `GET /api/cp/problems?topic=...&page=...`, official Codeforces public API, curated LeetCode links |
| Account persistence and privacy | `supabase/migrations/0010_knowledge_cp.sql`, `apps/web/src/app/api/data/[kind]/route.ts`, `apps/web/src/app/api/export/route.ts` | Owner-only `saved_knowledge`; extended existing `cp_manual_progress`; own-data export/reset |
| Product integration and verification | Nav, dashboard, landing, Study/Developer/Visual/CP screens, `apps/web/tests/{knowledge,cp-library}.test.ts`, `apps/web/tests/{upgrade-browser,account-browser,backend}.cjs`, README files | Shared learning navigation and regression checks |

`GITHUB_SEARCH_TOKEN` is optional and server-only; it is documented in `apps/web/.env.example`. Crossref, World Bank and Codeforces need no application key. Gemini uses the existing server-only AI configuration. No private profile, support chat or academic record is sent to these metadata providers; knowledge search sends the typed query, and the optional Gemini request sends that query plus public source metadata after explicit consent.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run test:logic`: passed; 47 logic cases cover provider responses, empty/malformed/rate-limited providers, stale cache, partial multi-source results, fake citation rejection, CP filters/recommendations and existing learning/safety logic.
- `npm run build` and `npm run build:account-test`: passed.
- `npm run test:upgrade-browser`: passed search/save/Study handoff, hint → Visual Lab → CP return, privacy query guard and mobile axe checks.
- `npm run test:browser`: passed 24 demo routes in English/Bangla mobile layouts, accessibility and offline checks.
- `bash supabase/test-stack.sh`, `npm run test:backend`, `npm run test:account-browser`: passed against disposable local PostgreSQL/GoTrue/PostgREST, including cross-user RLS, saved knowledge, CP progress, CSRF and account persistence. Hosted database was not modified.
- `npm run test:client-boundary`: passed; 62 client bundles did not contain AI/service-role bindings or configured secret values.
- Real public metadata smoke checks locally returned Crossref papers, World Bank Bangladesh inflation values and GitHub repositories. These are availability observations, not deterministic CI tests.

## Limits and demo data

- The public hosted site is still a fictional demo. This working-tree upgrade is not deployed. Demo account data is synthetic, demo knowledge saves and CP progress are session-only, and demo assistant behavior remains local/mock. Account persistence and optional Gemini require hosted Supabase/auth/environment setup and migration `0010`.
- Gemini explanation was validated with schema/unit tests and account availability controls; no live keyed Gemini request was made in this environment. It may fail on provider quota, invalid output or weak metadata, and the UI explicitly asks students to check original sources.
- Crossref metadata is not full-paper content; World Bank supports a short allowlisted set of indicators/countries; GitHub repositories are examples rather than official documentation. The comparison view preserves separate source claims; written AI synthesis is available only with the optional configured Gemini path. The app does not infer a factual conflict from unrelated metadata.
- Codeforces problems are public metadata from its API when reachable, with a bounded tag sample and conservative topic mapping. Some topics have only curated links. LeetCode has curated metadata/links, no live scraper or synced LeetCode account. Curated Codeforces links deliberately show unknown rating until live metadata is verified. Daily practice uses the recorded status and available library; it does not claim to measure skill or predict rating growth.
- Visual Lab retains its six working animations with accessible text steps/controls. The larger requested DSA/DBMS topic catalog remains future content; unsupported topics link to their topic path and practice rather than displaying a fake animation. No full problem solutions or externally fetched copyrighted statements are stored.
- In-process caches and per-process search throttling reset on redeploy and are not a distributed quota system. Public provider availability and metadata freshness depend on those services. Search warns against entering private details and rejects obvious contact strings, but students still control what they type.

## Recommended next work

1. Review and deploy this change, apply migration `0010` to the intended Supabase project, set the account-mode environment, then repeat hosted smoke tests for search, saves, CP progress and data export.
2. Add official documentation/book/video providers where their API and licensing terms permit, plus a clearer side-by-side source comparison workflow for overlapping claims.
3. Expand curated CP coverage and Visual Lab animations topic by topic, checking source links and instructional quality. Add a durable distributed cache/quota if real traffic requires it.
