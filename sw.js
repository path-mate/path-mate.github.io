/* هم‌مسیر — سرویس‌ورکر آفلاین (cache-first) | نسخه ۱٫۳ */
const C = 'hammaseer-v1-4-0';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const isFont = u.hostname.includes('fonts.googleapis.com') || u.hostname.includes('fonts.gstatic.com');
  if (e.request.method !== 'GET' || (!isFont && u.origin !== location.origin)) return;
  // صفحه‌ی اصلی: اول شبکه (تا نسخه‌ی تازه دیده شود)، در نبود اینترنت از کش
  const isDoc = e.request.mode === 'navigate' || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname));
  if (isDoc) {
    e.respondWith(fetch(e.request)
      .then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: u.origin === location.origin }).then(hit => hit ||
    fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return res;
    }).catch(() => caches.match('./index.html'))));
});
