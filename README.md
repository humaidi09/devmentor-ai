# DevMentor AI

> **Your Autonomous CS Learning, Competitive Programming, and Developer Companion**

An agentic, personalized AI mentor for CS/CSE students, Codeforces users, and
junior developers. It understands your goals, builds and adjusts a study plan,
recommends Codeforces problems twice a day, explains CS topics clearly (English
& Bangla), reviews code, and keeps a searchable snippet library — on a **$0/month
free-tier stack**.

- **Agentic, not just a chatbot:** an orchestrator classifies intent, pulls your
  context, routes to specialized modules, schedules notifications, and logs its
  decisions — with human-in-the-loop confirmation for anything risky.
- **Runs with zero setup:** demo mode uses an in-memory store and mock AI, so you
  can click through the whole product before configuring any keys.

---

## ✨ Features (modules)

| Module | What it does |
|---|---|
| **CS Study Mentor** | Explains DSA, DBMS, OS, networks, system design; level-aware; EN/BN. |
| **AutoTask AI** | Turns schedule + courses + deadlines into a realistic plan with breaks, buffers, and compassionate missed-task recovery. |
| **CP Coach** | Codeforces profile sync, rating-band problem picks, 2 daily sessions, status tracking, upcoming contests. |
| **DevSnippet AI** | 60+ seeded copy-ready snippets across 12 categories + your personal library, with full-text search. |
| **Developer Mentor** | Structured, analysis-only code review and debugging help. |
| **Analytics & Reflection** | Streaks, weekly study charts, topic performance, honest weekly summaries. |

### Screens
Landing · Sign in/up · Onboarding wizard · Dashboard (Today's Plan + Focus) ·
Tasks & Planner · AI Chat · Codeforces · Snippets · Code Review · Analytics ·
Settings.

---

## 🧱 Architecture (short)

```
Next.js (Vercel)  ──HTTPS──▶  FastAPI (Render)  ──▶  Supabase (Postgres + Auth + RLS)
     │                              │
     │                              ├─▶ Gemini (optional; mock fallback)
     │                              └─▶ Codeforces public API
GitHub Actions cron ──x-cron-secret──▶ /internal/cron/* (idempotent)
```

Full diagrams in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). API reference in
[docs/API.md](docs/API.md).

---

## 🚀 Local setup

**Prereqs:** Node 20+, Python 3.11+.

### 1) Backend (demo mode, no secrets)
```bash
cd apps/api
cp .env.example .env
python -m venv .venv
source .venv/Scripts/activate      # Windows (Git Bash). macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API at http://localhost:8000 · docs at `/docs`.

### 2) Frontend
```bash
cd apps/web
cp .env.local.example .env.local   # demo mode on by default
npm install
npm run dev                        # http://localhost:3000
```

Click **Get started** → onboarding → dashboard. Everything works against the
in-memory demo data.

---

## 🔑 Environment variables

See [`.env.example`](.env.example) (root reference), plus `apps/api/.env.example`
and `apps/web/.env.local.example`. Nothing is required for demo mode.

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | api + web | project + public key |
| `SUPABASE_SERVICE_ROLE_KEY` | api only | cron/admin (never in the browser) |
| `SUPABASE_JWT_SECRET` | api only | verify user JWTs |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | api | AI (mock fallback if unset) |
| `RESEND_API_KEY`, `EMAIL_FROM` | api | optional email notifications |
| `CRON_SECRET` | api + GH secret | protect `/internal/cron/*` |
| `NEXT_PUBLIC_*` | web | only these reach the browser |

### Supabase setup
1. Create a free project at supabase.com.
2. Run the SQL in order (SQL editor or `psql`):
   `supabase/migrations/0001…0004`, then `supabase/seed.sql` (public snippets).
3. Copy URL, anon key, service role key, and JWT secret into the `.env` files.
4. Set `DEMO_MODE=false` (api) and `NEXT_PUBLIC_DEMO_MODE=false` (web).

### Gemini setup
Create a free key at aistudio.google.com → set `GEMINI_API_KEY`. Model name is
configurable via `GEMINI_MODEL` (default `gemini-2.0-flash`).

### Firebase (optional web push)
Add your FCM config later; until then in-app notifications + optional email are
used. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### GitHub Actions cron
Add repo **secrets**: `API_BASE_URL` (your deployed API) and `CRON_SECRET`
(match the API). Workflows in `.github/workflows/cron-*.yml` call the secured
endpoints on a schedule (approximate — see limitations).

---

## 🧪 Tests
```bash
cd apps/api && pytest          # planner, timezones, CF filtering, API integration
cd apps/web && npm run typecheck
```

---

## 📦 Deployment
Vercel (web) + Render free tier (api) + Supabase + GitHub Actions cron.
Step-by-step: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🔒 Privacy & safety
RLS, JWT verification, no service keys in the browser, rate limits, input
validation, a data-deletion endpoint, no academic-cheating help, and no
guaranteed grades/ratings/jobs. See [docs/PRIVACY.md](docs/PRIVACY.md).

## 💸 Free-tier limitations
Cold starts, approximate cron timing, LLM/CF rate limits, push requires
permission. See [docs/FREE_TIER_LIMITATIONS.md](docs/FREE_TIER_LIMITATIONS.md).

---

## 🗺️ Status

**Phase 1 (foundation) — done & verified (40 backend tests passing):** monorepo,
Supabase schema + RLS + full-text search, FastAPI (auth, CRUD, dashboard,
snippets, notifications, planner, analytics, demo mode), Next.js (landing, auth,
onboarding, dashboard + focus timer, tasks, snippets, chat, Codeforces, code
review, analytics, settings), seed data, tests, docs.

**Phase 2 (agentic study system) — done:** intent-routed chat with conversation
memory and audit log; weekly + daily plan generation; compassionate missed-task
recovery; timezone-aware, idempotent cron endpoints; weekly summaries. A quiz
module feeds weak-topic detection → the planner adds targeted revision tasks.

**Phase 3 (competitive programming) — done:** rating-band recommendation engine
that excludes solved/recommended problems, twice-daily sessions, contest
reminders, and post-contest upsolve logic (real Codeforces data when keys are
configured; graceful no-op otherwise).

**Phases 4–5 (next):** richer code-review tooling and accessibility/polish.
Deployment with live Supabase + Gemini keys is documented in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
