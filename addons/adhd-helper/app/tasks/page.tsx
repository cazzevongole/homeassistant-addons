'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Checkbox,
  Chip, FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit, AccessTime } from '@mui/icons-material';
import { useTasks } from '@/lib/store';
import { useStore } from '@/lib/store';
import type { Priority, Task } from '@/lib/types';
import { formatDateIt, isoToLocalParts, todayLocal } from '@/lib/date';
import { SyncStatus } from '@/components/SyncStatus';

const priorityColors: Record<Priority, 'default' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
};

const priorityLabels: Record<Priority, string> = {
  low: 'bassa', medium: 'media', high: 'alta',
};

function TasksInner() {
  const { tasks, saveTask, deleteTask, setDone } = useTasks();
  const { online } = useStore();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as Priority,
    dueDate: '', reminderDate: '', reminderTime: '',
  });

  // Open the dialog immediately when arriving from the quick-capture shortcut
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const t = setTimeout(() => {
        setForm({ title: '', description: '', priority: 'medium', dueDate: todayLocal(), reminderDate: '', reminderTime: '' });
        setOpen(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', reminderDate: '', reminderTime: '' });
    setEditing(null);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    const parts = t.reminder_at ? isoToLocalParts(t.reminder_at) : { date: '', time: '' };
    setForm({
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.due_date ?? '',
      reminderDate: t.reminder_at ? parts.date : '',
      reminderTime: t.reminder_at ? parts.time : '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const reminder_at =
      form.reminderDate && form.reminderTime
        ? new Date(`${form.reminderDate}T${form.reminderTime}`).toISOString()
        : null;
    await saveTask({
      id: editing?.id,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      due_date: form.dueDate || null,
      reminder_at,
      notified: editing?.notified ?? false,
    });
    setOpen(false);
    resetForm();
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Task</Typography>
          <SyncStatus />
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setOpen(true); }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Nuova task
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {([['all', 'Tutte'], ['active', 'Attive'], ['completed', 'Completate']] as const).map(([f, label]) => (
          <Chip key={f} label={label} onClick={() => setFilter(f)}
            color={filter === f ? 'primary' : 'default'}
            variant={filter === f ? 'filled' : 'outlined'} sx={{ cursor: 'pointer' }} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filtered.map((task) => (
          <Paper key={task.id} sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, width: '100%', gap: 1 }}>
              <Checkbox checked={task.completed} onChange={() => setDone(task, !task.completed)} size="small" />
              <Box sx={{
                flexGrow: 1, minWidth: 0,
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.6 : 1,
              }}>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{task.title}</Typography>
                {task.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                    {task.description}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: { xs: 4, sm: 0 } }}>
              <Chip label={priorityLabels[task.priority]} size="small" color={priorityColors[task.priority]} />
              {task.due_date && <Chip label={formatDateIt(task.due_date)} size="small" variant="outlined" />}
              {task.reminder_at && !task.notified && (
                <Tooltip title="Promemoria attivo">
                  <Chip icon={<AccessTime />} size="small" color="warning" variant="outlined"
                    label={isoToLocalParts(task.reminder_at).time} />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display: 'flex', mt: { xs: 1, sm: 0 } }}>
              <IconButton size="small" onClick={() => openEdit(task)} aria-label="Modifica task">
                <Edit />
              </IconButton>
              <IconButton size="small" onClick={() => deleteTask(task.id)} aria-label="Elimina task">
                <Delete />
              </IconButton>
            </Box>
          </Paper>
        ))}
        {filtered.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {online ? 'Nessuna task. Aggiungine una per iniziare!' : 'Sei offline: le task salvate appaiono qui.'}
          </Typography>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifica task' : 'Nuova task'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <TextField label="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <FormControl fullWidth>
            <InputLabel>Priorità</InputLabel>
            <Select value={form.priority} label="Priorità"
              onChange={(e: SelectChangeEvent) => setForm({ ...form, priority: e.target.value as Priority })}>
              <MenuItem value="low">Bassa</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Data di scadenza" type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} fullWidth
            slotProps={{ inputLabel: { shrink: true } }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Promemoria — data" type="date" value={form.reminderDate}
              onChange={(e) => setForm({ ...form, reminderDate: e.target.value })} fullWidth
              slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Promemoria — ora" type="time" value={form.reminderTime}
              onChange={(e) => setForm({ ...form, reminderTime: e.target.value })} fullWidth
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Salva' : 'Crea'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksInner />
    </Suspense>
  );
}
