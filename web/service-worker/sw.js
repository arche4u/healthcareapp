/**
 * OneHealth Service Worker - Offline support for patient PWA
 */
const CACHE_NAME = "onehealth-v1";
const OFFLINE_URL = "/offline";

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/styles/globals.css",
        "/offline",
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version or fetch from network
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });

      // Return cached or network response
      return cached || fetchPromise;
    }).catch(() => {
      // If both fail, try offline page
      return caches.match(OFFLINE_URL);
    })
  );
});

// Handle notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || "You have a new notification from OneHealth",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title || "OneHealth", options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});