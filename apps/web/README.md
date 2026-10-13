# Close AI web application

The Phase 2 prototype is a Next.js 15 / React 19 application in this directory. Node.js 22 is used by CI. No API keys or backend services are required; old Supabase environment variables do not turn this prototype into a live authenticated product.

## Development

```bash
npm ci
npm run dev
```

## Phase 2 checks

```bash
npm run typecheck
npm run lint
npm run test:logic
npm run build
npm start -- --hostname 127.0.0.1 --port 3001
```

In a second terminal:

```bash
npx playwright install chromium
npm run test:browser
```

`PLAYWRIGHT_EXECUTABLE_PATH` can select an already installed Chromium. The browser checks require the local production build on port 3001. They cover actual user interactions, both languages on mobile, axe accessibility rules, keyboard focus, offline reload/chat, and scoped data clearing. These tests never target the live website.

## Demo behavior and data

- Onboarding is optional. Campus-not-listed keeps the fictional demo boundary visible.
- Preferences (language, module visibility, reminder opt-in, quiet-hour choices) and saved resource IDs remain in this browser. A storage-disabled browser can still use session state.
- Chat, study tasks and support steps are transient UI data, not stored in a production database. Chat is deterministic; offline chat runs the same local demo engine.
- Reminder buttons flag a step while its page is open. They do not schedule notifications. Quiet-hour choices are stored for a future scheduler.
- Six Visual Learning topics: BFS, DFS, Bubble Sort, Binary Search, SQL INNER JOIN and Normalization (UNF → 1NF → 2NF → 3NF). Array inputs are editable and validated. Graph/table examples are fixed, auditable examples.
- Demo data clearing removes only keys owned by Close AI, not other applications' local storage. Production account deletion/export is not implemented or advertised as working.

## Offline support

`prebuild` generates `public/sw.js` with a unique cache version. The worker precaches an explicit public-demo route/asset allowlist; it does not cache API responses or user-entered query responses. Activation removes only older Close AI caches. Offline navigation uses full-document loads so it can reuse saved HTML without caching React Server Component responses.

A successful initial online visit is needed. If storage/service workers are unavailable, the UI reports the limitation; uncached pages show a bilingual offline fallback. External links still require a connection. The worker is production-only. Reassess the public allowlist before adding authentication or personalized server-rendered pages.

## Documentation

The original Phase 1 package is in [`../../close-ai-phase1`](../../close-ai-phase1). The [updated Phase 2 report](../../close-ai-phase1/docs/PHASE_2_REPORT.md) records implementation, validation and intentionally deferred work. The uploaded report described a different source layout; the paths and checks here refer to this actual repository.
