const CACHE = 'op8-v13';
const PRECACHE = [
  './',
  './index.html',
  './kabinet-vykladacha.html',
  './zayava.html',
  './prezentatsiya.html',
  './css/style.css',
  './js/app.js',
  './js/quiz.js',
  './js/cabinet.js',
  './js/progress.js',
  './js/sync.js',
  './js/trainer.js',
  './js/simulators.js',
  './js/certificate.js',
  './js/instructor.js',
  './content/course.js',
  './content/links.js',
  './brand/logo.svg',
  './brand/logo-mark.svg',
  './brand/logo-mark-rays.svg',
  './brand/fonts/inter-cyrillic.woff2',
  './brand/fonts/inter-latin.woff2',
  './brand/icons/icon-192.png',
  './brand/icons/icon-512.png',
  './assets/schemes/istoria-proektu.svg',
  './assets/schemes/istorychna-shkala.svg',
  './assets/schemes/mentalna-karta.svg',
  './assets/schemes/von-neumann.svg',
  './certificate/sertyfikat.html',
  './certificate/cert.css',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
