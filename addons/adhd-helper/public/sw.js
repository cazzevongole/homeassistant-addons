/* ADHD Helper service worker — push + reminders + basic offline cache */
const CACHE_NAME = 'adhd-helper-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']).catch(() => {}),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

/* ---------- Web Push ---------- */
self.addEventListener('push', (event) => {
  let payload = { title: 'ADHD Helper', body: 'Hai un promemoria' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag || `adhd-${Date.now()}`,
      data: { url: payload.url || '/' },
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // URL assoluto same-origin: /tasks per i task, /planner per i blocchi agenda
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // 1) una finestra già sulla sezione giusta: solo focus
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      // 2) una finestra qualsiasi dell'app: focus + navigazione interna alla sezione
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            await client.focus();
            await client.navigate(target);
          } catch {
            /* some clients refuse navigate; the SPA root still shows the app */
          }
          return client;
        }
      }
      // 3) nessuna finestra: apri nuova sulla sezione
      return self.clients.openWindow(target);
    })(),
  );
});

/* ---------- Background reminder check while SW is alive ---------- */
const REMINDER_INTERVAL = 5 * 60 * 1000;

async function checkReminders() {
  try {
    const res = await fetch('/api/reminders/due', { credentials: 'include' });
    if (!res.ok) return;
    const items = await res.json();
    for (const item of items) {
      await self.registration.showNotification(item.title, {
        body: item.body,
        icon: '/icons/icon-192.png',
        tag: item.tag,
        data: { url: item.url || '/' },
        vibrate: [200, 100, 200],
      });
    }
  } catch {
    /* offline — silently skip */
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CHECK_REMINDERS') checkReminders();
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Run while the SW page is alive (best effort; cron covers the rest)
setInterval(checkReminders, REMINDER_INTERVAL);

/* ---------- Basic runtime caching for static assets ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json';

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          }),
      ),
    );
  }
  // Navigations & API: network-first with no caching (freshness matters)
});
