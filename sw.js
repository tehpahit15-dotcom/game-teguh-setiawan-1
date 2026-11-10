// Service worker sederhana: cache-first untuk aset game agar bisa dimainkan
// offline setelah pertama kali dibuka. Versi naikkan kalau aset berubah.
const CACHE = 'lembah-kenanga-v2';
const CORE = [
  './',
  './index.html',
  './game.html',
  './manifest.json',
  './src/main.js',
  './src/data/math.json',
  './src/data/npcs.json',
  './src/data/items.json',
  './src/data/crops.json',
  './src/data/shops.json',
  './src/data/fish.json',
  './assets/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Jangan cache panggilan API / Sheets — selalu ke jaringan.
  if (url.pathname.includes('/api/') || url.hostname.includes('script.google')) return;
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.status === 200 && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
