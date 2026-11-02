// public/service-worker.js

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

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
    data: {
      url: data.link || '/',
      notificationId: data.notificationId || null,
      userId: data.userId || null,
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;
  const userId = event.notification.data?.userId;

  // 🔑 ثبت کلیک
  if (notificationId) {
    event.waitUntil(
      fetch('/api/push/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          user_id: userId,
        }),
      }).catch((err) => console.error('[SW] Click track error:', err))
    );
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', () => {
  console.log('[SW] Notification closed');
});