/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// SATA Progressive Web App Service Worker - Optimized Performance Edition
const CACHE_NAME = 'sata-pwa-cache-v3';
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/metadata.json',
  '/favicon.ico'
];

// Helper to keep caches clean and avoid storage quota overflow
const MAX_CACHE_ITEMS = 80;
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => {
          trimCache(cacheName, maxItems);
        });
      }
    });
  });
}

// Installation event - pre-cache critical SBD form and PKI app assets
self.addEventListener('install', (event) => {
  console.log('[SATA SW] Installing Service Worker & caching core offline assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Force refresh critical assets to ensure fresh state
        return cache.addAll(PRE_CACHE_ASSETS);
      })
      .then(() => {
        console.log('[SATA SW] Pre-caching complete. Skipping waiting.');
        return self.skipWaiting();
      })
  );
});

// Activation event - prune old cache versioning tables
self.addEventListener('activate', (event) => {
  console.log('[SATA SW] Activating Service Worker & purging obsolete cache vaults...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[SATA SW] Deleting outdated cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SATA SW] Claiming clients control and activating optimized fetch paths.');
      return self.clients.claim();
    })
  );
});

// Intercept fetch requests for seamless offline execution
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Exclude third-party analytics trackers, hot reloading, or secure dynamic API proxies from cache
  if (!event.request.url.startsWith('http') || 
      requestUrl.pathname.includes('/api/health') || 
      requestUrl.pathname.includes('/socket.io') ||
      requestUrl.hostname.includes('hot-reload')) {
    return;
  }

  // Optimize cache strategies depending on the asset type
  // Fonts and Static Assets: Cache-First strategy to bypass unnecessary network hops
  if (event.request.destination === 'font' || event.request.url.includes('gstatic.com') || event.request.url.includes('googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // General App Assets: Stale-While-Revalidate strategy for lightning-fast visual loads with transparent updates
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            trimCache(CACHE_NAME, MAX_CACHE_ITEMS);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[SATA SW] Network fetch failed, offline mode active for:', event.request.url);
        // If it's a page navigation request, return index.html to support SPA routing offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        return null;
      });

      // If we have a cached response, return it immediately (stale-while-revalidate),
      // otherwise wait for the network fetch or serve our fallback
      return cachedResponse || networkFetch.then((res) => {
        if (res) return res;
        // Fallback if network failed and no cache hit
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        return new Response('Network error occurred offline', { status: 503, statusText: 'Offline Fallback' });
      });
    })
  );
});

// Listen for message events from client apps to sync cache or clear buffers
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  } else if (event.data && event.data.action === 'purgeCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SATA SW] Offline cache purged via user intervention.');
    });
  }
});

// Real-time Push Alert Notifications Listener
self.addEventListener('push', (event) => {
  console.log('[SATA SW] Push notification received:', event);
  let data = { title: 'SATA Tender Bulletin', body: 'A new matching municipal notice was published!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'SATA Tender Alert', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [150, 50, 100, 50, 150],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'sata-push-notification'
    },
    actions: [
      { action: 'explore', title: 'Open SATA Bulletin Feed' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  console.log('[SATA SW] Notification click received. Action:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});
