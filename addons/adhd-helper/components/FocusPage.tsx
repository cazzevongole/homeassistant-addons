'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, Slider, Alert, Snackbar, IconButton,
} from '@mui/material';
import { PlayArrow, Pause, Stop, SkipNext, Delete } from '@mui/icons-material';

type Session = { id: number; duration: number; completed: boolean; startedAt: string; endedAt: string | null; label: string };

const MODES = {
  focus: { label: 'Focus', default: 25, color: '#7c4dff' },
  shortBreak: { label: 'Short Break', default: 5, color: '#00e5ff' },
  longBreak: { label: 'Long Break', default: 15, color: '#69f0ae' },
};

type Mode = keyof typeof MODES;

export function FocusPage() {
  const [mode, setMode] = useState<Mode>('focus');
  const [duration, setDuration] = useState(MODES.focus.default);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [label, setLabel] = useState('');
  const [notification, setNotification] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingRef = useRef(false);

  useEffect(() => {
    fetch('/api/focus-sessions').then(r => r.json()).then(setSessions);
  }, []);

  useEffect(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (timeLeft === 0 && running && !completingRef.current) {
      completingRef.current = true;
      completeSession();
    }
  }, [timeLeft]);

  const sendNotification = (title: string, body: string) => {
    if (notifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    setNotification(`${title}: ${body}`);
  };

  const toggleNotify = () => {
    if ('Notification' in window) {
      if (!notifyEnabled) {
        Notification.requestPermission().then(perm => {
          setNotifyEnabled(perm === 'granted');
        });
      } else {
        setNotifyEnabled(false);
      }
    }
  };

  const completeSession = async () => {
    setRunning(false);
    const res = await fetch('/api/focus-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, completed: true, label, endedAt: new Date().toISOString() }),
    });
    const saved = await res.json();
    setSessions(prev => [...prev, saved]);
    sendNotification('Focus Timer', `${MODES[mode].label} session complete!`);
    completingRef.current = false;
  };

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration * 60);
      completingRef.current = false;
    }
    setRunning(!running);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(duration * 60);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setDuration(MODES[m].default);
    setRunning(false);
  };

  const deleteSession = async (id: number) => {
    await fetch(`/api/focus-sessions/${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Focus Timer</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        {(Object.keys(MODES) as Mode[]).map(m => (
          <Chip key={m} label={MODES[m].label} onClick={() => switchMode(m)}
            sx={{ bgcolor: mode === m ? MODES[m].color : '#333', color: mode === m ? '#000' : '#fff', cursor: 'pointer', fontWeight: 600 }} />
        ))}
        <Chip label={notifyEnabled ? '🔔 Notifications on' : '🔕 Notifications off'} onClick={toggleNotify} variant="outlined" sx={{ cursor: 'pointer' }} />
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', bgcolor: '#1e1e1e', mb: 4 }}>
        <Box sx={{ position: 'relative', width: { xs: 200, sm: 280 }, height: { xs: 200, sm: 280 }, mx: 'auto', mb: 3 }}>
          <svg width="100%" height="100%" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="130" fill="none" stroke="#333" strokeWidth="8" />
            <circle cx="140" cy="140" r="130" fill="none" stroke={MODES[mode].color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 130}`}
              strokeDashoffset={`${2 * Math.PI * 130 * (1 - progress / 100)}`}
              transform="rotate(-90 140 140)" strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Typography variant="h2" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: { xs: '2.5rem', sm: '3.75rem' } }}>{formatTime(timeLeft)}</Typography>
            <Typography variant="body2" color="text.secondary">{MODES[mode].label}</Typography>
          </Box>
        </Box>

        <TextField label="Session label" value={label} onChange={e => setLabel(e.target.value)}
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
            {running ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Start'}
          </Button>
          <Button variant="outlined" size="large" onClick={resetTimer} startIcon={<Stop />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}>Reset</Button>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Session History</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sessions.slice().reverse().slice(0, 10).map(s => (
          <Paper key={s.id} sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1, bgcolor: '#1e1e1e' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1">{s.label || `${MODES.focus.label} Session`}</Typography>
              <Typography variant="body2" color="text.secondary">{new Date(s.startedAt).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              <Chip label={`${s.duration} min`} color={s.completed ? 'success' : 'default'} />
              <IconButton size="small" onClick={() => deleteSession(s.id)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}
        {sessions.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No sessions yet. Start your first focus session!</Typography>}
      </Box>

      <Snackbar open={!!notification} autoHideDuration={4000} onClose={() => setNotification('')}>
        <Alert severity="success" onClose={() => setNotification('')}>{notification}</Alert>
      </Snackbar>
    </Box>
  );
}
