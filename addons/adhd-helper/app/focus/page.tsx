'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, Slider, Snackbar, Alert, IconButton, Tooltip,
} from '@mui/material';
import { PlayArrow, Pause, Stop, Delete } from '@mui/icons-material';
import { useFocusSessions, useStore } from '@/lib/store';
import { SyncStatus } from '@/components/SyncStatus';

const MODES = {
  focus: { label: 'Focus', default: 25, color: '#7c4dff' },
  short: { label: 'Pausa corta', default: 5, color: '#00e5ff' },
  long: { label: 'Pausa lunga', default: 15, color: '#69f0ae' },
} as const;

type Mode = keyof typeof MODES;

export default function FocusPage() {
  const { addSession, sessions, deleteSession } = useFocusSessions();
  const { online } = useStore();
  const [mode, setMode] = useState<Mode>('focus');
  const [duration, setDuration] = useState<number>(MODES.focus.default);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('');
  const [snack, setSnack] = useState('');
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<string>('');
  const completeRef = useRef<() => void>(() => {});

  const completeSession = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    endAtRef.current = null;
    addSession({
      duration,
      label,
      completed: true,
      started_at: sessionStartRef.current || new Date().toISOString(),
      ended_at: new Date().toISOString(),
    });
    setSnack(`${MODES[mode].label} completata! +15 XP 🎉`);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Focus Timer', { body: `${MODES[mode].label} completata!`, icon: '/icons/icon-192.png' });
    }
  };

  // Keep the latest completion callback available to the interval
  useEffect(() => {
    completeRef.current = completeSession;
  });

  // Drift-free countdown based on absolute end timestamp
  useEffect(() => {
    if (!running) return;
    if (endAtRef.current === null) {
      endAtRef.current = Date.now() + timeLeft * 1000;
      sessionStartRef.current = new Date().toISOString();
    }
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round(((endAtRef.current ?? 0) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        completeRef.current();
      }
    }, 250);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const toggleTimer = () => {
    if (!running && timeLeft === 0) {
      setTimeLeft(duration * 60);
      endAtRef.current = null;
    }
    setRunning(!running);
  };

  const resetTimer = () => {
    setRunning(false);
    endAtRef.current = null;
    setTimeLeft(duration * 60);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setDuration(MODES[m].default);
    setRunning(false);
    endAtRef.current = null;
    setTimeLeft(MODES[m].default * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Focus Timer</Typography>
        <SyncStatus />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Chip key={m} label={MODES[m].label} onClick={() => switchMode(m)}
            sx={{
              bgcolor: mode === m ? MODES[m].color : '#333',
              color: mode === m ? '#000' : '#fff',
              cursor: 'pointer', fontWeight: 600,
            }} />
        ))}
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', mb: 4 }}>
        <Box sx={{ position: 'relative', width: { xs: 200, sm: 260 }, height: { xs: 200, sm: 260 }, mx: 'auto', mb: 3 }}>
          <svg width="100%" height="100%" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="130" fill="none" stroke="#333" strokeWidth="8" />
            <circle cx="140" cy="140" r="130" fill="none" stroke={MODES[mode].color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 130}`}
              strokeDashoffset={`${2 * Math.PI * 130 * (1 - progress / 100)}`}
              transform="rotate(-90 140 140)" strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
          </svg>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Typography variant="h2" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: { xs: '2.5rem', sm: '3.5rem' } }}>
              {formatTime(timeLeft)}
            </Typography>
            <Typography variant="body2" color="text.secondary">{MODES[mode].label}</Typography>
          </Box>
        </Box>

        <TextField label="Etichetta sessione" value={label} onChange={(e) => setLabel(e.target.value)}
          sx={{ mb: 3, maxWidth: 300, width: '100%' }} size="small" />

        <Box sx={{ mb: 3 }}>
          <Slider value={duration} onChange={(_, v) => !running && setDuration(v as number)}
            min={1} max={120} disabled={running}
            sx={{ maxWidth: 300, mx: 'auto', color: MODES[mode].color }} />
          <Typography variant="body2" color="text.secondary">{duration} min</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" size="large" onClick={toggleTimer}
            startIcon={running ? <Pause /> : <PlayArrow />}
            sx={{ bgcolor: MODES[mode].color, color: '#000', width: { xs: '100%', sm: 'auto' } }}>
            {running ? 'Pausa' : timeLeft === 0 ? 'Ricomincia' : 'Avvia'}
          </Button>
          <Button variant="outlined" size="large" onClick={resetTimer} startIcon={<Stop />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}>Reset</Button>
        </Box>
        {!online && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Offline — la sessione verrà sincronizzata alla riconnessione.
          </Typography>
        )}
      </Paper>

      <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Storico sessioni</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sessions.slice().reverse().slice(0, 15).map((s) => (
          <Paper key={s.id} sx={{
            p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', gap: 1,
          }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1">{s.label || 'Sessione focus'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(s.started_at).toLocaleString('it-IT')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              <Chip label={`${s.duration} min`} color={s.completed ? 'success' : 'default'} />
              <IconButton size="small" onClick={() => deleteSession(s.id)} aria-label="Elimina sessione">
                <Delete />
              </IconButton>
            </Box>
          </Paper>
        ))}
        {sessions.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Nessuna sessione. Inizia la prima!
          </Typography>
        )}
      </Box>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')}>
        <Alert severity="success">{snack}</Alert>
      </Snackbar>
    </Box>
  );
}
