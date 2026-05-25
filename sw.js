const STATIC_CACHE_NAME = 'chaat-static-v3';
const IMAGE_CACHE_NAME = 'chaat-images-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './menu.html',
  './cart.html',
  './orders.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './css/404.css',
  './js/accessibility.js',
  './js/cart-manager.js',
  './js/geolocation.js',
  './js/main.js',
  './js/recently-viewed.js',
  './js/sanitization.js',
  './js/pwa.js',
  './data/menu.json',
  './favicon.png',
  './img/chaat.png',
  './img/1.avif',
  './img/2.avif',
  './img/7.avif',
  './img/8.avif',
  './img/9.avif',
  './img/icon-192.png',
  './img/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/women/45.jpg'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static core assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle Caching Strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests (e.g. POST for newsletters or forms)
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy 1: Cache First for Images
  if (
    event.request.destination === 'image' ||
    requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|avif|webp|svg)$/)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              // If offline and image not cached, fallback to offline icon/image
              return caches.match('./img/icon-192.png');
            });
        });
      })
    );
    return;
  }

  // Strategy 2: Network First for HTML files & menu.json (Dynamic updates)
  if (
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('.html') ||
    requestUrl.pathname.endsWith('menu.json')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the latest page version
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If network fails, try fetching from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If page is not in cache, redirect to elegant offline fallback page
            return caches.match('./offline.html');
          });
        })
    );
    return;
  }

  // Strategy 3: Stale While Revalidate for static resources (CSS, JS, Fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Silent catch, fallback strictly to cache if network fails
        });

      return cachedResponse || fetchPromise;
    })
  );
});
