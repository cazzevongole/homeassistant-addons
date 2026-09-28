'use client';

import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import { Add, Delete, Check, Close } from '@mui/icons-material';
import { useHabits } from '@/lib/store';
import { useStore } from '@/lib/store';
import { todayLocal, lastNDays, addDays, dayLabel } from '@/lib/date';
import { SyncStatus } from '@/components/SyncStatus';

const DAYS_SHOWN = 14;

function streakOf(logs: { habit_id: string; date: string }[], habitId: string): number {
  let streak = 0;
  let cursor = todayLocal();
  // Allow today not being checked yet without breaking the streak
  const doneToday = logs.some((l) => l.habit_id === habitId && l.date === cursor);
  if (!doneToday) cursor = addDays(cursor, -1);
  for (let i = 0; i < 400; i++) {
    if (logs.some((l) => l.habit_id === habitId && l.date === cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }
  return streak;
}

export default function HabitsPage() {
  const { habits, logs, saveHabit, deleteHabit, toggleLog } = useHabits();
  const { online } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const days = lastNDays(DAYS_SHOWN);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await saveHabit({ name: form.name.trim(), description: form.description });
    setOpen(false);
    setForm({ name: '', description: '' });
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Abitudini</Typography>
          <SyncStatus />
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Nuova abitudine
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {habits.map((habit) => {
          const streak = streakOf(logs, habit.id);
          const doneToday = logs.some((l) => l.habit_id === habit.id && l.date === todayLocal());
          return (
            <Paper key={habit.id} sx={{ p: 2 }}>
              <Box sx={{
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1, mb: 2,
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{habit.name}</Typography>
                  {habit.description && <Typography variant="body2" color="text.secondary">{habit.description}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={`🔥 ${streak} giorni`} size="small" color={streak > 0 ? 'warning' : 'default'} />
                  <Tooltip title={doneToday ? 'Fatto oggi!' : 'Segna oggi'}>
                    <Chip
                      label={doneToday ? 'Oggi ✔' : 'Oggi'}
                      onClick={() => toggleLog(habit.id, todayLocal())}
                      color={doneToday ? 'success' : 'default'}
                      variant={doneToday ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
                    />
                  </Tooltip>
                  <IconButton size="small" onClick={() => deleteHabit(habit.id)} aria-label="Elimina abitudine">
                    <Delete />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1 }}>
                {days.map((day) => {
                  const done = logs.some((l) => l.habit_id === habit.id && l.date === day);
                  return (
                    <Box key={day} sx={{ textAlign: 'center', cursor: 'pointer', flex: '1 0 38px' }}
                      onClick={() => toggleLog(habit.id, day)}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {dayLabel(day)}
                      </Typography>
                      <Chip
                        icon={done ? <Check /> : <Close />}
                        label={day.slice(8)}
                        size="small"
                        sx={{
                          mt: 0.5, width: '100%',
                          bgcolor: done ? 'success.main' : '#2a2a2a',
                          color: done ? '#000' : '#999',
                          '& .MuiChip-icon': { color: done ? '#000' : '#666', fontSize: 14 },
                          '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
        {habits.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {online
              ? 'Nessuna abitudine. Creane una da tenere d\u2019occhio!'
              : 'Sei offline — le abitudini salvate appaiono qui.'}
          </Typography>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuova abitudine</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
          <TextField label="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSubmit}>Crea</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
