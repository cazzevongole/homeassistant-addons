'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Checkbox,
  Chip, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Edit, AccessTime } from '@mui/icons-material';

type Task = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  reminder: string | null;
  notified: boolean;
  createdAt: string;
  updatedAt: string;
};

const priorityColors = {
  low: 'default',
  medium: 'warning',
  high: 'error',
} as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], dueDate: '', reminder: '' });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks);
  }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', reminder: '' });
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const reminder = form.dueDate && form.reminder
      ? new Date(`${form.dueDate}T${form.reminder}:00`).toISOString()
      : null;
    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/tasks/${editing.id}` : '/api/tasks';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reminder }),
    });
    const saved = await res.json();
    if (editing) {
      setTasks(prev => prev.map(t => t.id === saved.id ? saved : t));
    } else {
      setTasks(prev => [...prev, saved]);
    }
    setOpen(false);
    resetForm();
  };

  const toggleComplete = async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const parseReminder = (reminder: string | null) => {
    if (!reminder) return { dueDate: '', reminder: '' };
    const d = new Date(reminder);
    if (isNaN(d.getTime())) {
      const [date, time] = reminder.split('T');
      return { dueDate: date || '', reminder: time ? time.slice(0, 5) : '' };
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      dueDate: d.toLocaleDateString('en-CA'),
      reminder: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Tasks & Reminders</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setOpen(true); }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Add Task
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} onClick={() => setFilter(f)}
            color={filter === f ? 'primary' : 'default'} variant={filter === f ? 'filled' : 'outlined'} sx={{ cursor: 'pointer' }} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map(task => (
          <Paper key={task.id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, bgcolor: '#1e1e1e' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, width: '100%', gap: 1 }}>
              <Checkbox checked={task.completed} onChange={() => toggleComplete(task)} size="small" />
              <Box sx={{ flexGrow: 1, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{task.title}</Typography>
                {task.description && <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{task.description}</Typography>}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { xs: 4, sm: 0 }, mb: { xs: 1, sm: 0 } }}>
              <Chip label={task.priority} size="small" color={priorityColors[task.priority]} />
              {task.dueDate && <Chip label={task.dueDate} size="small" variant="outlined" />}
              {task.reminder && !task.notified && <Chip icon={<AccessTime />} label={parseReminder(task.reminder).reminder} size="small" color="warning" variant="outlined" />}
              {task.reminder && task.notified && <Chip icon={<AccessTime />} label={parseReminder(task.reminder).reminder} size="small" variant="outlined" sx={{ opacity: 0.5, textDecoration: 'line-through' }} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 0, mt: { xs: 1, sm: 0 } }}>
              <IconButton size="small" onClick={() => { setEditing(task); const parsed = parseReminder(task.reminder); setForm({ title: task.title, description: task.description, priority: task.priority, dueDate: parsed.dueDate, reminder: parsed.reminder }); setOpen(true); }}>
                <Edit />
              </IconButton>
              <IconButton size="small" onClick={() => deleteTask(task.id)}>
                <Delete />
              </IconButton>
            </Box>
          </Paper>
        ))}
        {filtered.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No tasks yet. Add one to get started!</Typography>}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })} label="Priority">
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Reminder Time" type="time" value={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
