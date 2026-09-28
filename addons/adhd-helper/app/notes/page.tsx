'use client';

import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Delete, Edit, PushPin } from '@mui/icons-material';
import { useNotes, useStore } from '@/lib/store';
import { SyncStatus } from '@/components/SyncStatus';

export default function NotesPage() {
  const { notes, saveNote, deleteNote } = useNotes();
  const { online } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [search, setSearch] = useState('');

  const openEdit = (note: typeof notes[number]) => {
    setEditing({ id: note.id });
    setForm({ title: note.title, content: note.content });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() && !form.content.trim()) return;
    await saveNote({
      id: editing?.id,
      title: form.title.trim() || '(senza titolo)',
      content: form.content,
    });
    setOpen(false);
    setEditing(null);
    setForm({ title: '', content: '' });
  };

  const filtered = notes
    .filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Brain Dump</Typography>
          <SyncStatus />
        </Box>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setEditing(null); setForm({ title: '', content: '' }); setOpen(true); }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Nuova nota
        </Button>
      </Box>

      <TextField placeholder="Cerca nelle note…" value={search} onChange={(e) => setSearch(e.target.value)}
        fullWidth sx={{ mb: 3 }} size="small" />

      <Grid container spacing={2}>
        {filtered.map((note) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.id}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {note.pinned && <PushPin sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main' }} />}
              <Typography variant="h6" sx={{ wordBreak: 'break-word', mb: 1, pr: 4 }}>{note.title}</Typography>
              <Typography variant="body2" color="text.secondary"
                sx={{ flexGrow: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 2 }}>
                {note.content}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                  {new Date(note.updated_at).toLocaleDateString('it-IT')}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={() => saveNote({ ...note, pinned: !note.pinned })}
                    aria-label="Blocca nota">
                    <PushPin sx={{ color: note.pinned ? 'primary.main' : '#666', fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => openEdit(note)} aria-label="Modifica nota">
                    <Edit sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteNote(note.id)} aria-label="Elimina nota">
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {filtered.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {online ? 'Nessuna nota. Scarica qui i tuoi pensieri!' : 'Sei offline — le note salvate appaiono qui.'}
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifica nota' : 'Nuova nota'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <TextField label="Contenuto" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} fullWidth multiline rows={8} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Salva' : 'Crea'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
