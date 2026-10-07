# Free-Tier Limitations

DevMentor is designed to run at **$0/month**. That comes with honest trade-offs.
We do not claim anything is unlimited or "free forever."

## Cold starts (backend)
Free hosts (e.g. Render) **sleep** after inactivity. The first request after idle
can take ~30–60s to wake. The frontend tolerates this (loading states); keep a
lightweight pinger only if you accept the resource usage.

## Scheduling is approximate
GitHub Actions cron is **best-effort** and can run late or be skipped under load;
it also won't run if Actions are disabled. Because every cron endpoint is
**idempotent** and computes dates **per user timezone**, approximate/duplicate
runs are safe — but exact-minute delivery is not guaranteed. Default cadence:
daily-planning every 6h, send-notifications every 15m, weekly-summary Sundays.

## LLM limits (Gemini)
The free tier has request/token rate limits and may be unavailable. Without a key
the app returns clearly-labelled **mock** responses. We keep prompts lean; add
caching if you hit limits.

## Codeforces API
The public API has availability and rate constraints and can return errors. The
client degrades gracefully; in demo mode (or when unreachable) a small set of
**real, well-known public problems** is used — we never fabricate submissions or
results.

## Notifications
- **Web push** requires explicit browser permission and (for production) a
  Firebase/FCM setup — treated as a future enhancement.
- **Email** needs a provider (Resend) key; otherwise emails are logged, not sent.
- **In-app** notifications always work.
- A per-user **daily cap** and **quiet hours** intentionally limit volume.

## Supabase free tier
Row/storage/bandwidth limits apply and projects may pause on prolonged
inactivity. Fine for personal use and demos; monitor usage as you grow.

## Vercel free tier
Hobby plan has bandwidth/build limits and is for non-commercial use. Review
Vercel's current terms before any commercial deployment.

## Not in the MVP (by design)
No paid SMS, no always-on worker, no Redis/Pinecone/paid vector DB, no job-board
scraping or auto-apply, no Google Calendar (optional/future with OAuth + consent),
and no server-side code execution.

## Known security advisories (accepted, build-time only)
`npm audit` on the web app reports a handful of **moderate/high** advisories in
`postcss` / `postcss-selector-parser`, pulled in transitively by **Next.js** and
**Tailwind's** build tooling.

- **Why they're accepted:** these packages run **only at build time** on our own
  first-party CSS. They are not in the deployed runtime, and the app never
  processes untrusted CSS, so there is no realistic exploit path for this
  product. CVSS rates them generically; in context the real risk is negligible.
- **The one that mattered** — a *critical* Next.js image-optimization RCE
  (AVIF) — was real and has been **fixed** by upgrading Next.js 14 → 15.
- **Fully clearing the rest** requires Next.js 16 **and** Tailwind CSS 4, both
  major, breaking upgrades. We defer these until we adopt those majors
  deliberately, rather than forcing them (`npm audit fix --force`) and risking
  build regressions for no runtime security benefit.
- **Revisit when:** upgrading to Tailwind 4 / Next 16, or if any of these
  packages ever enters the production runtime.
