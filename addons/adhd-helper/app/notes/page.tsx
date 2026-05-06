'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Edit, PushPin } from '@mui/icons-material';

type Note = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(setNotes);
  }, []);

  const resetForm = () => {
    setForm({ title: '', content: '' });
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/notes/${editing.id}` : '/api/notes';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const saved = await res.json();
    if (editing) {
      setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
    } else {
      setNotes(prev => [...prev, saved]);
    }
    setOpen(false);
    resetForm();
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = async (note: Note) => {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    const updated = await res.json();
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Brain Dump</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setOpen(true); }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          New Note
        </Button>
      </Box>

      <TextField placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)}
        fullWidth sx={{ mb: 3 }} size="small" />

      <Grid container spacing={2}>
        {filtered.map(note => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.id}>
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {note.pinned && <PushPin sx={{ position: 'absolute', top: 8, right: 8, color: '#7c4dff' }} />}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{note.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 2 }}>
                {note.content}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={() => togglePin(note)}><PushPin sx={{ color: note.pinned ? '#7c4dff' : '#666' }} /></IconButton>
                  <IconButton size="small" onClick={() => { setEditing(note); setForm({ title: note.title, content: note.content }); setOpen(true); }}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteNote(note.id)}><Delete /></IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {filtered.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No notes yet. Brain dump your thoughts here!</Typography>}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Note' : 'New Note'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} fullWidth multiline rows={8} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
