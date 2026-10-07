# DevMentor AI — Web (Next.js)

Next.js 14 (App Router) + TypeScript (strict) + Tailwind.

## Run

```bash
cp .env.local.example .env.local   # defaults to demo mode
npm install
npm run dev                         # http://localhost:3000
```

In **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`, the default) the app skips
auth and talks to the backend's in-memory demo data — no Supabase needed.
Start the API too (`apps/api`, port 8000) so pages have data.

## Scripts
- `npm run dev` — dev server
- `npm run build` / `npm start` — production
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — Next ESLint

## Going live
Set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com
NEXT_PUBLIC_DEMO_MODE=false
```

## Structure
```
src/
  app/
    (auth)/          sign-in, sign-up
    (app)/           authed shell: dashboard, tasks, chat, cp, snippets,
                     code-review, analytics, settings
    onboarding/      wizard
    page.tsx         landing
  components/        UI kit, app-shell, feature components
  lib/               api client, supabase, auth, types, config
```
