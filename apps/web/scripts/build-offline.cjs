const fs = require('node:fs');
const crypto = require('node:crypto');
const source = fs.readFileSync('scripts/offline-worker.js', 'utf8');
// Every production build replaces stale page/chunk caches atomically on activation.
fs.writeFileSync('public/sw.js', source.replace('__BUILD_VERSION__', crypto.randomUUID()));
