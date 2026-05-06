'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

type PlannerItem = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  completed: boolean;
  taskId: number | null;
};

const timeSlots = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 7;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export default function PlannerPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerItem | null>(null);
  const [form, setForm] = useState({ title: '', startTime: '09:00', endTime: '10:00' });

  useEffect(() => {
    fetch(`/api/planner?date=${date}`).then(r => r.json()).then(setItems);
  }, [date]);

  const resetForm = () => {
    setForm({ title: '', startTime: '09:00', endTime: '10:00' });
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/planner/${editing.id}` : '/api/planner';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date }),
    });
    const saved = await res.json();
    if (editing) {
      setItems(prev => prev.map(i => i.id === saved.id ? saved : i));
    } else {
      setItems(prev => [...prev, saved]);
    }
    setOpen(false);
    resetForm();
  };

  const toggleComplete = async (item: PlannerItem) => {
    const res = await fetch(`/api/planner/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !item.completed }),
    });
    const updated = await res.json();
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/planner/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getItemForSlot = (slot: string) => sorted.find(i => i.startTime === slot);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Daily Planner</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField type="date" value={date} onChange={e => setDate(e.target.value)}
            size="small" slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: { xs: 1, sm: 'auto' } }} />
          <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setOpen(true); }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Add Block
          </Button>
        </Box>
      </Box>

      <Paper sx={{ bgcolor: '#1e1e1e' }}>
        {timeSlots.map(slot => {
          const item = getItemForSlot(slot);
          return (
            <Box key={slot} sx={{
              display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid #333',
              bgcolor: item ? (item.completed ? 'rgba(105, 240, 174, 0.1)' : 'rgba(124, 77, 255, 0.1)') : 'transparent',
            }}>
              <Typography variant="body2" sx={{ width: { xs: 50, sm: 70 }, color: 'text.secondary', fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{slot}</Typography>
              {item ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
                  <Checkbox checked={item.completed} onChange={() => toggleComplete(item)} size="small" />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.6 : 1, fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-word' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{item.startTime} - {item.endTime}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => { setEditing(item); setForm({ title: item.title, startTime: item.startTime, endTime: item.endTime }); setOpen(true); }}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteItem(item.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ flexGrow: 1 }}>Free</Typography>
              )}
            </Box>
          );
        })}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Time Block' : 'New Time Block'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Start" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
              fullWidth slotProps={{ select: { native: true } }}>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
            <TextField select label="End" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
              fullWidth slotProps={{ select: { native: true } }}>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
