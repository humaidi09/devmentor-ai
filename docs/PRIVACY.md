# Privacy, Safety & Ethics

## What we store and why
To personalize your plan we store: profile (name, language, timezone, level,
goals, availability), courses, deadlines, tasks and study sessions, Codeforces
handle + CP preferences and recommendations, snippets you save, quiz attempts,
notifications, chat messages, and weekly summaries. We store an **agent audit
log** (intent + which module ran + whether AI was mocked) so decisions are
transparent — it never contains secrets.

## Security controls
- **Row Level Security (RLS)** on every table: you can read/write only your own
  rows. Built-in public snippets are read-only to all authenticated users; the
  audit log is append-and-read-your-own.
- **JWT verification** in the API (HS256, Supabase JWT secret). Requests use a
  Supabase client scoped to your token, so the database enforces access.
- The **service-role key never reaches the browser**; it is used only by
  server-side cron.
- **Rate limiting** on AI chat and Codeforces endpoints; **Pydantic** validates
  all input; a **consistent error envelope** avoids leaking internals; logs
  never include secrets or raw tokens.

## Your data, your control
- **Export/delete:** `DELETE /api/me?confirm=true` erases all your app data
  (Settings → Danger zone). Deleting the Supabase **auth account** itself is an
  admin/service action documented for operators; app data removal is immediate.
- We do **not** monitor on behalf of teachers, parents, or employers.
- We never message external people in the MVP, and never access accounts beyond
  the integrations you authorize (your own Codeforces handle via the public API).

## Human-in-the-loop
Generated plans and problem picks are **proposals you can edit**. The agent does
not delete data, send email, or change major preferences without an explicit
action from you.

## Academic integrity
DevMentor **teaches** — explanations, hints, practice, outlines, and review of
your drafts. It will **not** complete an active graded assignment on your
behalf.

## No false promises
We never guarantee grades, rankings, jobs, or salaries. Codeforces guidance uses
cautious language ("practice trend", "estimated readiness"), never a predicted
rating.

## Code safety
Code review is **analysis-only**; untrusted code is **never executed** on the
server. Any future execution feature must run in an isolated sandbox.

## Wellbeing
DevMentor offers general, encouraging check-ins and burnout/rest suggestions. It
is **not** a medical or mental-health service — for emergencies or health
concerns, please consult a qualified professional.
