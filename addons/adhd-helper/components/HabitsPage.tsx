'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Check, Undo } from '@mui/icons-material';

type Habit = { id: number; name: string; description: string; frequency: string; targetDays: string; createdAt: string };
type HabitLog = { id: number; habitId: number; date: string; completed: boolean; notes: string };

const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
};

export function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const days = getLast7Days();

  useEffect(() => {
    Promise.all([
      fetch('/api/habits').then(r => r.json()),
      fetch('/api/habit-logs').then(r => r.json()),
    ]).then(([h, l]) => { setHabits(h); setLogs(l); });
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const saved = await res.json();
    setHabits(prev => [...prev, saved]);
    setOpen(false);
    setForm({ name: '', description: '' });
  };

  const toggleLog = async (habitId: number, date: string) => {
    const existing = logs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      const res = await fetch(`/api/habit-logs/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !existing.completed }),
      });
      const updated = await res.json();
      setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
    } else {
      const res = await fetch('/api/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date, completed: true }),
      });
      const saved = await res.json();
      setLogs(prev => [...prev, saved]);
    }
  };

  const deleteHabit = async (id: number) => {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogs(prev => prev.filter(l => l.habitId !== id));
  };

  const getStreak = (habitId: number) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
      if (log?.completed) streak++; else break;
    }
    return streak;
  };

  const getLog = (habitId: number, date: string) => logs.find(l => l.habitId === habitId && l.date === date);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Habit Tracker</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Add Habit</Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {habits.map(habit => {
          const streak = getStreak(habit.id);
          return (
            <Paper key={habit.id} sx={{ p: 2, bgcolor: '#1e1e1e' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{habit.name}</Typography>
                  {habit.description && <Typography variant="body2" color="text.secondary">{habit.description}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={`${streak} day streak`} size="small" color="primary" />
                  <IconButton size="small" onClick={() => deleteHabit(habit.id)}><Delete /></IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {days.map(day => {
                  const log = getLog(habit.id, day);
                  const dayName = new Date(day).toLocaleDateString('en', { weekday: 'short' });
                  return (
                    <Box key={day} sx={{ textAlign: 'center', cursor: 'pointer', flex: '1 1 0', minWidth: 40 }} onClick={() => toggleLog(habit.id, day)}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{dayName}</Typography>
                      <Chip
                        icon={log?.completed ? <Check /> : <Undo />}
                        label={new Date(day).getDate()}
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: log?.completed ? '#69f0ae' : '#333',
                          color: log?.completed ? '#000' : '#888',
                          width: '100%',
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
        {habits.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No habits yet. Start tracking a new habit!</Typography>}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Habit</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
