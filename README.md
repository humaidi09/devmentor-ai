# Close AI

Student support first, with optional Academic Study, Developer Path, Visual Learning and CP manual progress. The application lives in [`apps/web`](apps/web): Next.js + Supabase Auth/PostgreSQL/RLS, with a separate bilingual fictional demo.

```bash
cd apps/web
npm ci
npm run dev
```

Default demo mode needs no credentials. For persistent accounts, follow [Supabase setup and checks](apps/web/README.md). All seeded campus support records are fictional and marked **DEMO**. Account mode now supports validated Gemini resource selection, optional Codeforces public data and consent-controlled in-app reminders. Demo remains local/mock; hosted account configuration is still required.

Phase 1 planning is preserved in [`close-ai-phase1`](close-ai-phase1). [Phase 2 verification](close-ai-phase1/docs/PHASE_2_REPORT.md), [Phase 3](PHASE_3_REPORT.md), [Phase 4](PHASE_4_REPORT.md), [Phase 5](PHASE_5_REPORT.md) and [Phase 6](PHASE_6_REPORT.md) reports describe actual behavior, tests and remaining deployment limits. The older FastAPI service is retained in `apps/api` but is not called by Close AI.

**Readiness:** the application is ready for internal testing, not a limited real-campus pilot. The public website currently runs a fictional demo; hosted account setup, real verified campus resources, human owners and recovery checks remain open. Use the [pre-launch checklist](docs/PRE_LAUNCH_CHECKLIST.md) and [current deployment guide](docs/DEPLOYMENT.md) before changing that status. [Test evidence](docs/TEST_REPORT.md), [security findings](docs/SECURITY_REVIEW.md), [privacy boundaries](docs/PRIVACY_AND_SAFETY.md), [pilot plan](docs/PILOT_EVALUATION.md), [pilot operations](docs/PILOT_OPERATIONS.md) and the [changelog](CHANGELOG.md) are available for review.

Database migrations in [`supabase/migrations`](supabase/migrations) adapt the existing schema without replacing historical migrations. Review the legacy grant changes before applying them to a shared older deployment. Current [architecture](docs/ARCHITECTURE.md), [privacy](docs/PRIVACY_AND_SAFETY.md) and [decisions](docs/DECISIONS.md) document the implemented boundaries.

### Phase 4: grounded support chat

Account chat searches the signed-in user's selected campus with PostgreSQL full-text relevance and strict verification/date filters. Set server-only `AI_PROVIDER=gemini`, `AI_MODEL` and `AI_API_KEY` (or the existing `GEMINI_API_KEY` binding). Default `mock` works without a key; Demo always uses fictional local data. Account mock uses database resources, not demo constants. Students explicitly choose to send the current message and up to three resource summaries to Gemini. No conversation history, profile or learning records are sent.

The model returns only selected resource IDs and allowlisted checklist keys. The server validates them and renders stored facts, canonical source URLs and missing-information warnings. It has no database tools, messaging tools or write permissions. Review/edit/reject checklist drafts; **Approve and save** requires storage consent and saves atomically. No reminder is created. Chat is memory-only and can be cleared. Provider failure leaves directory, saved resources, next steps and human support available.

Run `npm run test:logic`, `npm run test:backend`, `node tests/ai-backend.cjs` with the documented local stack; `node tests/ai-browser.cjs` against the account test server. `npx tsx tests/ai-live.ts` is a separate, explicit real-provider smoke test using fictional public context; it is excluded from CI. Run `npm run typecheck`, `npm run lint`, default and account builds. Apply migration `0007` before account chat.

### Phase 5: reminders and optional public integrations

Enable Reminders in Settings, save Notification preferences, then approve a dated reminder in Notification Center. The in-app engine supports once/daily/weekly schedules, Support steps, Academic deadlines and CP practice. It checks due reminders while the app is open; missed recurring reminders consolidate to one and advance to the next local-time occurrence. Quiet hours and IANA timezones/DST are respected. Support previews stay generic even when learning previews are enabled. Read/unread, mark all read, dismiss, disable and delete remain under user control. No off-app/email/push delivery is configured.

Codeforces is optional and requires no API key. Preview a public profile, explicitly confirm optional identifier storage, then load a recent submission sample or topic-filtered public practice. Only the handle/topic go to its official HTTPS API. Settings → Connected Services → Disconnect removes the stored handle/time; manual curated practice and local hints continue after network, rate-limit or validation failures. Cache: profile 5 minutes, submission sample 2 minutes, public problem metadata 30 minutes, up to 64 entries per server process; disconnect invalidates handle entries. Requests are bounded and throttled, with a durable per-user hourly allowance and no automatic retries.

Study suggestions use the student's own pending deadlines/tasks, stay editable/rejectable and are saved/rescheduled only on approval. Developer suggestions explain the first unfinished chosen-path milestone; project statuses are manual. Visual progress is optional: **Remember this step** / **Mark learning completed** stores only an explicit choice and supports resume/forget/related concepts. Support chats never enter these recommendations. The same fonts are bundled locally with OFL licenses/provenance so builds no longer depend on Google Fonts downloads.

Apply migrations `0008`–`0009` after earlier phases. Run `npm run test:phase5-backend` and `npm run test:phase5-browser` with the local account fixture; `npm run test:codeforces-live` is a separate real public-data smoke check. Phase reports distinguish local validation from the still-unverified hosted Supabase deployment. Email, push, LMS/calendar integrations, additional visual topics and Phase 6 production/pilot work are deferred.
