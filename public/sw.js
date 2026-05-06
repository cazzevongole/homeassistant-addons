const CHECK_INTERVAL = 30000;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

function checkReminders() {
  fetch(self.location.origin + '/api/reminders/check')
    .then(res => {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(tasks => {
      for (const task of tasks) {
        self.registration.showNotification('ADHD Helper - Task Reminder', {
          body: task.title,
          icon: '/favicon.ico',
          tag: `task-${task.id}`,
        });
      }
    })
    .catch(() => {});
}

self.addEventListener('message', (event) => {
  if (event.data.type === 'CHECK_NOW') {
    checkReminders();
  }
});

setInterval(checkReminders, CHECK_INTERVAL);
checkReminders();
