'use client';

import {
  Box, Typography, Paper, LinearProgress, Chip, Divider, Grid,
} from '@mui/material';
import {
  LocalFireDepartment, EmojiEvents, Timer, TaskAlt, EventRepeat, Bolt,
} from '@mui/icons-material';
import { useStore, useTasks, useFocusSessions, useHabits, usePlanner } from '@/lib/store';
import { levelProgress, XP_RULES } from '@/lib/types';
import { todayLocal, lastNDays } from '@/lib/date';
import { SyncStatus } from '@/components/SyncStatus';

export default function ProgressiPage() {
  const { profile } = useStore();
  const { tasks } = useTasks();
  const { sessions } = useFocusSessions();
  const { habits, logs } = useHabits();
  const { items } = usePlanner();

  const progress = levelProgress(profile?.xp ?? 0);
  const last7 = lastNDays(7);
  const today = todayLocal();

  const tasksDone7 = tasks.filter((t) => t.completed && t.completed_at && last7.includes(t.completed_at.slice(0, 10))).length;
  const focusMin7 = sessions
    .filter((s) => s.completed && last7.includes(s.started_at.slice(0, 10)))
    .reduce((n, s) => n + s.duration, 0);
  const habitChecks7 = logs.filter((l) => last7.includes(l.date)).length;
  const blocksDone7 = items.filter((i) => i.completed && last7.includes(i.date)).length;

  const totalTasks = tasks.filter((t) => t.completed).length;
  const totalFocus = sessions.filter((s) => s.completed).reduce((n, s) => n + s.duration, 0);

  const achievements = [
    { label: 'Prima task completata', done: totalTasks >= 1, icon: '✅' },
    { label: '10 task completate', done: totalTasks >= 10, icon: '🏆' },
    { label: 'Prima sessione focus', done: sessions.some((s) => s.completed), icon: '⏱️' },
    { label: '10 ore di focus', done: totalFocus >= 600, icon: '🧠' },
    { label: 'Streak di 7 giorni', done: (profile?.streak_days ?? 0) >= 7, icon: '🔥' },
    { label: 'Streak di 30 giorni', done: (profile?.streak_days ?? 0) >= 30, icon: '👑' },
    { label: 'Livello 5', done: (profile?.level ?? 1) >= 5, icon: '⭐' },
    { label: '100 check abitudini', done: logs.length >= 100, icon: '📈' },
  ];

  const stats = [
    { label: 'Task (7 gg)', value: tasksDone7, icon: <TaskAlt color="primary" /> },
    { label: 'Focus (7 gg)', value: `${focusMin7} min`, icon: <Timer color="primary" /> },
    { label: 'Abitudini (7 gg)', value: habitChecks7, icon: <EventRepeat color="primary" /> },
    { label: 'Blocchi (7 gg)', value: blocksDone7, icon: <Bolt color="primary" /> },
  ];

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Progressi</Typography>
        <SyncStatus />
      </Box>

      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>Livello {progress.level}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Bolt />} label={`${profile?.xp ?? 0} XP`} color="primary" variant="outlined" />
          <Chip icon={<LocalFireDepartment />} label={`${profile?.streak_days ?? 0} giorni di streak`} color="warning" variant="outlined" />
        </Box>
        <LinearProgress variant="determinate" value={progress.pct} sx={{ height: 10, borderRadius: 5, maxWidth: 420, mx: 'auto' }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {Math.max(0, progress.next - (profile?.xp ?? 0))} XP al livello {progress.level + 1}
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              {s.icon}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>Obiettivi</Typography>
        <Grid container spacing={1}>
          {achievements.map((a) => (
            <Grid size={{ xs: 12, sm: 6 }} key={a.label}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2,
                bgcolor: a.done ? 'rgba(105, 240, 174, 0.08)' : 'transparent',
                opacity: a.done ? 1 : 0.45,
              }}>
                <Typography sx={{ fontSize: '1.5rem' }}>{a.icon}</Typography>
                <Typography variant="body2" sx={{ fontWeight: a.done ? 600 : 400 }}>
                  {a.label} {a.done && '✔'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.disabled">
          Come guadagni XP: task bassa +{XP_RULES.taskLow} · media +{XP_RULES.taskMedium} · alta +{XP_RULES.taskHigh} ·
          blocco planner +{XP_RULES.plannerBlock} · sessione focus +{XP_RULES.focusSession} · abitudine +{XP_RULES.habitCheck}
        </Typography>
      </Paper>
    </Box>
  );
}
