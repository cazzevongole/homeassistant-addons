'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Chip, Snackbar, Alert } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';

export function NotificationBell() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [snack, setSnack] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      setEnabled(true);
      startPolling();
    }
  }, []);

  const startPolling = useCallback(() => {
    checkNow();
    intervalRef.current = setInterval(checkNow, 60000);
  }, []);

  const checkNow = useCallback(() => {
    fetch('/api/reminders/check')
      .then(res => res.json())
      .then(tasks => {
        for (const task of tasks) {
          if (Notification.permission === 'granted') {
            new Notification('ADHD Helper - Task Reminder', {
              body: task.title,
              icon: '/favicon.ico',
              tag: `task-${task.id}`,
            });
          }
          setSnack(`Reminder: ${task.title}`);
        }
      })
      .catch(() => {});
  }, []);

  const toggle = async () => {
    if (!('Notification' in window)) return;

    if (enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setEnabled(false);
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setEnabled(true);
      startPolling();
    }
  };

  if (!mounted || !('Notification' in window)) return null;

  return (
    <>
      <Chip
        icon={enabled ? <Notifications /> : <NotificationsOff />}
        label={enabled ? 'Reminders on' : 'Reminders off'}
        onClick={toggle}
        size="small"
        color={enabled ? 'success' : 'default'}
        variant={enabled ? 'filled' : 'outlined'}
        sx={{ cursor: 'pointer', ml: 1 }}
      />
      <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack('')}>
        <Alert severity="info" onClose={() => setSnack('')}>{snack}</Alert>
      </Snackbar>
    </>
  );
}
