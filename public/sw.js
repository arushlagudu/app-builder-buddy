// Service Worker for Skincare Routine Reminders

const CACHE_NAME = 'skincare-reminders-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Store scheduled reminder times
let scheduledReminders = {
  amTime: '07:00',
  pmTime: '21:00',
  enabled: false,
};

// Message handler from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'SCHEDULE_REMINDERS') {
    scheduledReminders = {
      amTime: payload.amTime,
      pmTime: payload.pmTime,
      enabled: payload.enabled,
    };
    console.log('Reminders scheduled:', scheduledReminders);
  }

  if (type === 'CLEAR_REMINDERS') {
    scheduledReminders.enabled = false;
    console.log('Reminders cleared');
  }
});

// Check time and send notification
function checkAndNotify() {
  if (!scheduledReminders.enabled) return;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (currentTime === scheduledReminders.amTime) {
    showNotification('AM');
  }

  if (currentTime === scheduledReminders.pmTime) {
    showNotification('PM');
  }
}

function showNotification(type) {
  const title = type === 'AM' ? '☀️ Morning Skincare' : '🌙 Evening Skincare';
  const body = type === 'AM' 
    ? 'Time for your morning skincare routine! Start your day with glowing skin.'
    : 'Time for your evening skincare routine! Prepare your skin for overnight repair.';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `skincare-${type.toLowerCase()}`,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Check every minute (service worker will be woken up by the browser)
setInterval(checkAndNotify, 60000);
