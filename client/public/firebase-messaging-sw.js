// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase app in service worker
// Since keys are injected during client build, we use fallbacks or query parameters
firebase.initializeApp({
  projectId: 'propane-avatar-476809-q2',
  messagingSenderId: '199913414397'
});

const messaging = firebase.messaging();

// Intercept background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('Intercepted background FCM message alert:', payload);

  const notificationTitle = payload.notification?.title || 'Breaking Bulletin';
  const notificationOptions = {
    body: payload.notification?.body || 'New article report released from the news desk.',
    icon: '/favicon.ico',
    data: { url: payload.data?.url || '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click action to open link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if target app window is already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }
      // If not, open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
