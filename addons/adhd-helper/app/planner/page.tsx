'use client';

import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { usePlanner } from '@/lib/store';
import { useStore } from '@/lib/store';
import { todayLocal, formatDateIt, normalizeTime } from '@/lib/date';
import { SyncStatus } from '@/components/SyncStatus';

const SLOTS = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

export default function PlannerPage() {
  const { items, saveItem, deleteItem } = usePlanner();
  const { online } = useStore();
  const [date, setDate] = useState(todayLocal());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({ title: '', startTime: '09:00', endTime: '10:00' });

  const dayItems = items
    .filter((i) => i.date === date)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const itemForSlot = (slot: string) =>
    dayItems.find((i) => i.start_time < `${slot.slice(0, 2)}:59` && i.end_time > slot);

  const openEdit = (item: typeof dayItems[number]) => {
    setEditing({ id: item.id });
    setForm({ title: item.title, startTime: item.start_time, endTime: item.end_time });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await saveItem({
      id: editing?.id,
      title: form.title.trim(),
      date,
      start_time: normalizeTime(form.startTime),
      end_time: normalizeTime(form.endTime),
    });
    setOpen(false);
    setEditing(null);
    setForm({ title: '', startTime: '09:00', endTime: '10:00' });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Planner</Typography>
          <SyncStatus />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} size="small"
            slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: { xs: 1, sm: 'auto' } }} />
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEditing(null); setForm({ title: '', startTime: '09:00', endTime: '10:00' }); setOpen(true); }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Nuovo blocco
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatDateIt(date)}
      </Typography>

      <Paper>
        {SLOTS.map((slot) => {
          const item = itemForSlot(slot);
          return (
            <Box key={slot} sx={{
              display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid #2a2a2a',
              bgcolor: item ? (item.completed ? 'rgba(105, 240, 174, 0.08)' : 'rgba(124, 77, 255, 0.10)') : 'transparent',
            }}>
              <Typography variant="body2" sx={{ width: { xs: 50, sm: 64 }, color: 'text.secondary', fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {slot}
              </Typography>
              {item ? (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
                  <Checkbox size="small" checked={item.completed}
                    onChange={() => saveItem({ ...item, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : null })} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{
                      textDecoration: item.completed ? 'line-through' : 'none',
                      opacity: item.completed ? 0.6 : 1,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word',
                    }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{item.start_time} – {item.end_time}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => openEdit(item)} aria-label="Modifica blocco"><Edit /></IconButton>
                  <IconButton size="small" onClick={() => deleteItem(item.id)} aria-label="Elimina blocco"><Delete /></IconButton>
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ flexGrow: 1 }}>Libero</Typography>
              )}
            </Box>
          );
        })}
      </Paper>

      {!online && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Offline — le modifiche si sincronizzano alla riconnessione.
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifica blocco' : 'Nuovo blocco'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Inizio" value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })} fullWidth
              slotProps={{ select: { native: true } }}>
              {SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </TextField>
            <TextField select label="Fine" value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })} fullWidth
              slotProps={{ select: { native: true } }}>
              {SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </TextField>
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
