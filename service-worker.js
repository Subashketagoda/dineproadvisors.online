const CACHE_NAME = 'dinepro-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/admin.html',
    '/staff-portal.html',
    '/style.css',
    '/script.js',
    '/logo.png.png',
    '/app-logo.jpg',
    '/manifest.json',
    '/manifest-staff.json',
    '/manifest-admin.json'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event (Network First, then Cache)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Push Event
self.addEventListener('push', function (event) {
    if (!event.data) return;
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: 'app-logo.jpg',
        badge: 'app-logo.jpg',
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };
    event.waitUntil(
        self.registration.showNotification(data.title || 'DinePro Notification', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
