// importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.2.0/workbox-sw.js');

// workbox.routing.registerRoute(
//     ({request}) => request.destination === 'image',
//     new workbox.strategies.NetworkFirst() 
// );

const cacheName = 'sclnt-cache';
const staticAssets = [
    '/',
    '/assets/js/forgotpassword.js',
    '/assets/js/login.js',
    '/assets/js/main.js',
    '/assets/js/signup.js',
    '/assets/css/forgotpassword.css',
    '/assets/css/index.css',
    '/assets/css/login.css',
    '/assets/css/signup.css',
    '/assets/css/main.css',
    '/images/SocialentTitle.svg',
    '/images/behindIndexBtns.svg',
    '/images/indexBackground.svg',
    '/images/loginBackground.svg',
    'images/SocialentLogo.svg',
    'images/icons/icon-192-192.png',
    'manifest.json',
    '/agreements/termsofuse',
    '/agreements/privacypolicy',
    '/forgotpassword',
    '/login',
    '/signup',
    'socket.io/socket.io.js',
]

self.addEventListener('install', async e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(staticAssets);
    })
  );
  return self.skipWaiting();
});
  
  // self.addEventListener('activate', e => {
  //   self.clients.claim();
  // });
  
self.addEventListener('fetch', async e => {
  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      return fetch(e.request) || cacheRes;
    })
  );
});

self.addEventListener('push', e => {
    var options = {
      body: e.data.text(),
      icon: 'images/icons/icon-512-512.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      actions: [
        {
          action: 'redirect', 
          title: 'Open',
          icon: 'images/icons/icon-192-192.png',
        },
        {
          action: 'close',
          title: 'Close',
          icon: 'images/icons/icon-192-192.png',
        },
      ]
    };
    e.waitUntil(
      self.registration.showNotification('SOCIALENT MESSAGE!', options)
    );
  });