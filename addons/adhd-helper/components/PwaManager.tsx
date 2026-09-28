'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { enablePush, currentPushEnabled } from '@/lib/push';

export function PwaManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      });
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Re-enable push silently when permission was already granted
    currentPushEnabled().then((on) => {
      if (!on && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        enablePush().then((r) => {
          if (r.ok) setSnack('Promemoria attivati 🔔');
        });
      }
    });

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const refreshApp = () => {
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <>
      <Snackbar open={updateReady} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          severity="info"
          action={<Button color="inherit" size="small" onClick={refreshApp}>Aggiorna</Button>}
        >
          Nuova versione disponibile
        </Alert>
      </Snackbar>
      <Snackbar open={!!installPrompt} autoHideDuration={15000} onClose={() => setInstallPrompt(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" onClick={() => { installPrompt?.prompt(); setInstallPrompt(null); }}>
              Installa
            </Button>
          }
          onClose={() => setInstallPrompt(null)}
        >
          Installa ADHD Helper sul dispositivo
        </Alert>
      </Snackbar>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')}>
        <Alert severity="success">{snack}</Alert>
      </Snackbar>
    </>
  );
}
