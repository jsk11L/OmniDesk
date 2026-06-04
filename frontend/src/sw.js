/* eslint-disable */
// OmniDesk — Service Worker for web push notifications.
// Registered from main.ts via navigator.serviceWorker.register('/sw.js').
// The payload comes from the backend NotificationsService.sendPushToUser (notifications.service.ts).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (_err) {
    payload = { title: 'OmniDesk', body: event.data.text() };
  }

  const title = payload.title || 'OmniDesk';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge.png',
    vibrate: [100, 50, 100],
    tag: payload.notificationId || undefined,
    data: {
      notificationId: payload.notificationId || null,
      accentColor: payload.accentColor || null,
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
