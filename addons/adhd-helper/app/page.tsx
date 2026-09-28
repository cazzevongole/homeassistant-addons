'use client';

import Link from 'next/link';
import {
  Box, Typography, Paper, Checkbox, LinearProgress, Chip, Button,
} from '@mui/material';
import {
  WbSunny as SunIcon, TaskAlt, EventRepeat, CalendarToday, ArrowForward,
  Add as AddIcon, LocalFireDepartment,
} from '@mui/icons-material';
import { useStore, useTasks, useHabits, usePlanner } from '@/lib/store';
import { levelProgress } from '@/lib/types';
import { todayLocal } from '@/lib/date';

export default function OggiPage() {
  const { profile, session } = useStore();
  const { tasks, setDone } = useTasks();
  const { habits, logs, toggleLog } = useHabits();
  const { items } = usePlanner();

  const today = todayLocal();
  const dueToday = tasks.filter((t) => !t.completed && (!t.due_date || t.due_date <= today));
  const doneToday = tasks.filter((t) => t.completed && t.completed_at?.startsWith(today)).length;
  const todaysBlocks = items
    .filter((i) => i.date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 4);
  const progress = levelProgress(profile?.xp ?? 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const name = profile?.display_name?.split(' ')[0] || '';

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SunIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {greeting}{name ? `, ${name}` : ''}
          </Typography>
        </Box>
      </Box>

      {/* Level card */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Livello {progress.level}</Typography>
          <Chip
            icon={<LocalFireDepartment />}
            label={`${profile?.streak_days ?? 0} giorni di streak`}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
        <LinearProgress variant="determinate" value={progress.pct} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption" color="text.secondary">
          {profile?.xp ?? 0} XP — prossimi {Math.max(0, progress.next - (profile?.xp ?? 0))} XP al livello {progress.level + 1}
        </Typography>
      </Paper>

      {/* Today's tasks */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            <TaskAlt sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
            Task di oggi{doneToday > 0 ? ' · ' : ''}
            {doneToday > 0 && (
              <Typography component="span" color="success.main" sx={{ fontWeight: 700 }}>
                {doneToday} ✔
              </Typography>
            )}
          </Typography>
          <Button size="small" endIcon={<ArrowForward />} href="/tasks">
            Tutte
          </Button>
        </Box>
        {dueToday.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            Tutto libero! Aggiungi una task se serve.
          </Typography>
        )}
        {dueToday.slice(0, 5).map((t) => (
          <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Checkbox size="small" checked={false} onChange={() => setDone(t, true)} />
            <Typography variant="body1" sx={{ flexGrow: 1 }}>{t.title}</Typography>
            {t.priority === 'high' && <Chip label="!" color="error" size="small" />}
          </Box>
        ))}
      </Paper>

      {/* Habits quick row */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            <EventRepeat sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
            Abitudini di oggi
          </Typography>
          <Button size="small" endIcon={<ArrowForward />} href="/habits">
            Tutte
          </Button>
        </Box>
        {habits.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            Nessuna abitudine ancora. Creane una dalla pagina Abitudini!
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {habits.map((h) => {
            const done = logs.some((l) => l.habit_id === h.id && l.date === today);
            return (
              <Chip
                key={h.id}
                label={h.name}
                onClick={() => toggleLog(h.id, today)}
                color={done ? 'success' : 'default'}
                variant={done ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Next blocks */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            <CalendarToday sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
            Prossimi blocchi
          </Typography>
          <Button size="small" endIcon={<ArrowForward />} href="/planner">
            Agenda
          </Button>
        </Box>
        {todaysBlocks.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            Nessun blocco in agenda per oggi.
          </Typography>
        )}
        {todaysBlocks.map((b) => (
          <Box key={b.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 0.5 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              {b.start_time}
            </Typography>
            <Typography
              variant="body1"
              sx={{ opacity: b.completed ? 0.5 : 1, textDecoration: b.completed ? 'line-through' : 'none' }}
            >
              {b.title}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button href="/tasks?new=1" variant="outlined" startIcon={<AddIcon />}>
          Cattura un pensiero veloce
        </Button>
      </Box>
      {session && !profile && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Caricamento profilo…
        </Typography>
      )}
    </Box>
  );
}
