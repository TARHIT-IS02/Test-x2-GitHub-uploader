/* ==========================================================================
   GitHub Uploader — service worker
   Purpose: notifications only. It never caches, intercepts or proxies a request.
   ========================================================================== */
'use strict';

const APP_NAME = 'GitHub Uploader';
const ICON = 'icon-192.png';
const BADGE = 'badge-96.png';
const DEFAULT_TAG = 'gh-uploader';

/* ==========================================================================
   1. LIFECYCLE — activate immediately and take over open pages
   ========================================================================== */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* ==========================================================================
   2. NOTIFICATION CLICK — bring the app to the front (or open it if closed)
   ========================================================================== */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Prefer a window the person can already see, then any other open window.
    all.sort((a, b) => (b.visibilityState === 'visible') - (a.visibilityState === 'visible'));
    for (const client of all) {
      if (!('focus' in client)) continue;
      try { await client.focus(); return; } catch (_) { /* try the next window */ }
    }
    if (self.clients.openWindow) {
      try { await self.clients.openWindow(url); }
      catch (_) { await self.clients.openWindow(self.registration.scope); }
    }
  })());
});

/* ==========================================================================
   3. PUSH — shows whatever { title, body, tag } a server push message carries
   ========================================================================== */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { /* plain-text or empty push */ }
  if (!data || typeof data !== 'object') data = {};
  e.waitUntil(self.registration.showNotification(data.title || APP_NAME, {
    body: data.body || '',
    tag: data.tag || DEFAULT_TAG,
    icon: ICON,
    badge: BADGE,
    data: { url: self.registration.scope }
  }));
});
