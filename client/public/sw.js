const CACHE_NAME = 'er-static-assets-v1';

// Versioned static assets and critical static media only (excluding HTML pages)
const STATIC_ASSETS_TO_PRECACHE = [
  '/logo.png',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS_TO_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // STRICT RULE: HTML documents must NEVER be cached by the Service Worker
  // They must always be fetched from the network.
  const isHtml = 
    url.pathname === '/' || 
    url.pathname === '/index.html' || 
    url.pathname.endsWith('.html') ||
    event.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    // Let HTML requests bypass the service worker cache entirely
    return;
  }

  // Caching ONLY: versioned static assets (/assets/*), fonts, logo, favicon, manifest, etc.
  const isVersionedAsset = url.pathname.startsWith('/assets/');
  const isStaticMedia = /\.(png|jpg|jpeg|svg|ico|woff2?|eot|ttf|otf|webmanifest|json)$/i.test(url.pathname);
  
  // Explicitly exclude internal APIs, Firebase, openweathermap, youtube, google translate, etc.
  const isInternalApi = url.pathname.startsWith('/api/');
  const isThirdParty = 
    url.hostname.includes('firebase') || 
    url.hostname.includes('googleapis') || 
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('openweathermap.org') ||
    url.hostname.includes('razorpay.com');

  const shouldCache = (isVersionedAsset || isStaticMedia) && !isInternalApi && !isThirdParty;

  if (shouldCache) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache but check for updates in background
          fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
