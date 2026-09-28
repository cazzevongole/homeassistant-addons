'use client';

import { useEffect, useRef, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useStore } from '@/lib/store';
import type { Task, PlannerItem } from '@/lib/types';
import { todayLocal } from '@/lib/date';

const CHECK_INTERVAL = 60_000; // 1 min

export function ReminderChecker() {
  const { data, mutate } = useStore();
  const [snack, setSnack] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const notify = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/icons/icon-192.png', tag: title });
      } catch { /* SW notification might take over */ }
    }
  };

  const checkRef = useRef<() => void>(() => {});

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const d = dataRef.current;

      // Task reminders not yet notified
      for (const t of d.tasks as Task[]) {
        if (t.reminder_at && !t.notified && new Date(t.reminder_at).getTime() <= now) {
          notify(`⏰ Promemoria: ${t.title}`, t.description || 'Scaduta prevista');
          mutate('tasks', 'update', { ...t, notified: true } as unknown as Record<string, unknown>);
          setSnack(`⏰ ${t.title}`);
        }
      }

      // Planner blocks starting soon (within 5 minutes, today)
      const today = todayLocal();
      for (const p of d.planner as PlannerItem[]) {
        if (p.date !== today || p.completed) continue;
        const [h, m] = p.start_time.split(':').map(Number);
        const start = new Date();
        start.setHours(h, m, 0, 0);
        const diff = start.getTime() - now;
        if (diff > 0 && diff <= 5 * 60_000) {
          const key = `planner-${p.id}-${p.date}`;
          const seen = sessionStorage.getItem(key);
          if (!seen) {
            sessionStorage.setItem(key, '1');
            notify(`📅 Tra poco: ${p.title}`, `${p.start_time} in agenda`);
            setSnack(`📅 ${p.start_time} — ${p.title}`);
          }
        }
      }
    };

    checkRef.current = check;
    check();
    timer.current = setInterval(() => checkRef.current(), CHECK_INTERVAL);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [mutate]);

  return (
    <Snackbar open={!!snack} autoHideDuration={6000} onClose={() => setSnack('')}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert severity="info" onClose={() => setSnack('')}>{snack}</Alert>
    </Snackbar>
  );
}
