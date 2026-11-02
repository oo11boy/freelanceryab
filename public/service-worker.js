// public/service-worker.js
// 🔔 Web Push Service Worker

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

// 🔔 دریافت push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());

  let data = {
    title: 'فریلنسرکار',
    message: 'اعلان جدید',
    link: '/',
    icon: '/icons/icon-192.png',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (err) {
    console.error('[SW] Parse error:', err);
  }

  const options = {
    body: data.message,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    image: data.image || undefined,
    data: {
      url: data.link || '/',
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 🖱️ کلیک روی اعلان
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // اگه تب باز هست، فوکوس کن
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // اگه نه، تب جدید باز کن
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// 🔄 بستن اعلان
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});