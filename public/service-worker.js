// importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.2.0/workbox-sw.js');

// workbox.routing.registerRoute(
//     ({request}) => request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script' || request.destination === 'json',
//     new workbox.strategies.NetworkFirst()
// );

const cacheName = 'news-v1';
const staticAssets = [
    './',
    './account',
    './admin',
    './agreements',
    './create',
    './forgotpassword',
    './home',
    './login',
    './messages',
    './post',
    './search',
    './signup',
    './assets/js/account.js',
    './assets/js/admin.js',
    './assets/js/create.js',
    './assets/js/forgotpassword.js',
    './assets/js/home.js',
    './assets/js/login.js',
    './assets/js/main.js',
    './assets/js/messages.js',
    './assets/js/post.js',
    './assets/js/rdp.js',
    './assets/js/search.js',
    './assets/js/signup.js',
    './assets/css/account.css',
    './assets/css/admin.css',
    './assets/css/create.css',
    './assets/css/forgotpassword.css',
    './assets/css/home.css',
    './assets/css/index.css',
    './assets/css/login.css',
    './assets/css/main.css',
    './assets/css/messages.css',
    './assets/css/post.css',
    './assets/css/rdp.css',
    './assets/css/search.css',
    './assets/css/signup.css',

]

self.addEventListener('install', async e => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
    return self.skipWaiting();
  });
  
  self.addEventListener('activate', e => {
    self.clients.claim();
  });
  
  self.addEventListener('fetch', async e => {
    const req = e.request;
    const url = new URL(req.url);
  
    if (url.origin === location.origin) {
      e.respondWith(cacheFirst(req));
    } else {
      e.respondWith(networkAndCache(req));
    }
  });
  
  async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    return cached || fetch(req);
  }
  
  async function networkAndCache(req) {
    const cache = await caches.open(cacheName);
    try {
      const fresh = await fetch(req);
      await cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await cache.match(req);
      return cached;
    }
  }