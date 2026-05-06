'use client';

import { useEffect, useState } from 'react';
import { Chip, Snackbar, Alert } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';

export function NotificationBell() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && Notification.permission === 'granted') {
        setEnabled(true);
      }
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'REMINDER') {
        setSnack(`Reminder: ${event.data.title}`);
      }
    });
  }, []);

  const toggle = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

    if (enabled) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.unregister();
      }
      setEnabled(false);
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      setEnabled(true);
    }
  };

  if (!mounted || !('serviceWorker' in navigator) || !('Notification' in window)) return null;

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
