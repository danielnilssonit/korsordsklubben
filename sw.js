// Korsordsklubben: sparar spelet i webbläsaren så att det startar även utan internet
const CACHE = 'kryss-41ffe5a349';
// Röstpaketen sparas för sig och byter namn när någon ljudfil ändras (då rensas de gamla bort)
const VOICE = 'kryss-voice-22d3b7d8';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kryss-') && k !== CACHE && k !== VOICE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // röstfilerna har innehållets kontrollvärde i adressen (?v=…): från cachen i första hand
    if (url.pathname.includes('/voice/')) { e.respondWith(caches.open(VOICE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok && res.status === 200) c.put(req, res.clone()); return res; })))); return; }
    e.respondWith(fetch(req).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$|(^|\.)cdnjs\.cloudflare\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
