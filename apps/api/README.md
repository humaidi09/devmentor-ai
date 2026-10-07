# DevMentor AI — API (FastAPI)

FastAPI + Pydantic v2. Verifies Supabase JWTs and enforces Row Level
Security by scoping each request's Supabase client to the user's token.
Runs fully in **demo mode** (in-memory store) with no secrets.

## Run

```bash
cp .env.example .env           # defaults to DEMO_MODE=true
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
# (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs, or
http://localhost:8000/health.

## Test

```bash
pytest
```

Tests force demo mode and run with no external services.

## Layout
```
app/
  main.py            app factory + router wiring
  core/              config, security (JWT), database, store, timeutils, ratelimit
  api/
    deps.py          auth + store + pagination dependencies
    errors.py        consistent error envelope
    routes/          me, dashboard, courses, deadlines, tasks, snippets,
                     notifications, cp, chat, focus, analytics, health
  services/          planner, analytics, cp, codeforces, notifications, gemini
  agent/             orchestrator + intent_router (controlled agentic flow)
  jobs/cron_routes.py  secured /internal/cron/* endpoints
  tests/
```

## Modes
- **Demo** (`DEMO_MODE=true` or no Supabase keys): stubbed user + in-memory
  data. No auth header required.
- **Live**: set `SUPABASE_*`; the API verifies JWTs and RLS applies in Postgres.
- **AI**: without `GEMINI_API_KEY`, chat returns clearly-labelled mock answers.
