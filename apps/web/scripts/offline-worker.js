/* Phase 2 caches public demo pages/assets only. Never cache API responses, query
   responses or user data. Revisit this allowlist before introducing accounts. */
const CACHE = 'close-ai-public-__BUILD_VERSION__';
const PAGES = ['/', '/onboarding', '/dashboard', '/support', '/support/resources', '/support/saved', '/support/steps', '/support/human', '/study', '/learn', '/cp', '/settings', '/learn/visual-lab',
  ...['bubble-sort', 'binary-search', 'bfs', 'dfs', 'sql-inner-join', 'normalization'].map(x => '/learn/visual-lab/' + x),
  ...['r-fin-tuition', 'r-fin-merit', 'r-fin-emergency', 'r-aca-tutoring', 'r-house-office', 'r-career-cell', 'r-well-hub', 'r-intl-visa'].map(x => '/support/resources/' + x)];
const ALLOWED = new Set(PAGES);
const asset = url => url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add('/offline.html');
    // A single unavailable route must not prevent the rest of the offline shell.
    for (let i = 0; i < PAGES.length; i += 4) {
      await Promise.all(PAGES.slice(i, i + 4).map(async path => {
        try {
          const response = await fetch(path, {cache: 'reload'});
          if (!response.ok || (/private|no-store/.test(response.headers.get('cache-control') || '') && response.headers.get('X-Close-AI-Cache') !== 'public-demo') || !response.headers.get('content-type')?.includes('text/html')) return;
          const html = await response.clone().text();
          await cache.put(path, response);
          const urls = [...html.matchAll(/(?:src|href)="([^"<>]+)"/g)].map(m => new URL(m[1].replaceAll('&amp;', '&'), self.location.origin)).filter(asset);
          await Promise.all([...new Set(urls.map(u => u.href))].map(async href => {
            if (await cache.match(href)) return;
            const file = await fetch(href);
            if (!file.ok) return;
            if (file.headers.get('content-type')?.includes('text/css')) {
              const css = await file.clone().text();
              const fonts = [...css.matchAll(/url\((?:["']?)([^)'"\s]+)["']?\)/g)].map(m => new URL(m[1], href)).filter(asset);
              await Promise.all(fonts.map(u => cache.add(u.href).catch(() => {})));
            }
            await cache.put(href, file);
          }));
        } catch { /* offline fallback remains available */ }
      }));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('close-ai-public-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (asset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(request)) || fetch(request).then(async response => {
        if (response.ok) await cache.put(request, response.clone());
        return response;
      });
    })());
  } else if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request, {signal: AbortSignal.timeout(4000)});
        if (response.ok && !(/private|no-store/.test(response.headers.get('cache-control') || '') && response.headers.get('X-Close-AI-Cache') !== 'public-demo') && ALLOWED.has(url.pathname) && !url.search && response.headers.get('content-type')?.includes('text/html')) await cache.put(url.pathname, response.clone());
        if (response.status >= 500) throw new Error('unavailable');
        return response;
      } catch {
        return (ALLOWED.has(url.pathname) && await cache.match(url.pathname)) || await cache.match('/offline.html');
      }
    })());
  }
});
