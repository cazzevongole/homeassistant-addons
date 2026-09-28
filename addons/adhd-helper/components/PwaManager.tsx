'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Snackbar, Alert, Button } from '@mui/material';
import { enablePush, currentPushEnabled } from '@/lib/push';

export function PwaManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [snack, setSnack] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);
  const pathname = usePathname();

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

    // Permessi notifiche: Chrome mostra il prompt SOLO dopo un gesto dell'utente,
    // quindi qui non si chiama requestPermission: con permesso già concesso si
    // ri-iscrive in silenzio; con permesso "default" si mostra l'invito col bottone
    // (vedi needsPermission). Mai dentro /auth e mai se l'utente li ha negati.
    if (typeof Notification !== 'undefined' && !pathname?.startsWith('/auth') && Notification.permission !== 'denied') {
      currentPushEnabled().then((on) => {
        if (on) return;
        if (Notification.permission === 'granted') {
          enablePush().then((r) => {
            if (r.ok) setSnack('Promemoria attivati 🔔');
          });
        } else {
          setNeedsPermission(true);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, [pathname]);

  const activateNotifications = async () => {
    setNeedsPermission(false);
    const r = await enablePush(); // chiamata dentro il gesto -> il prompt appare
    setSnack(r.ok ? 'Promemoria attivati 🔔' : `Notifiche non attivate: ${r.reason ?? ''}`);
  };

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
      <Snackbar
        open={needsPermission}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setNeedsPermission(false)}
      >
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={activateNotifications}>
              Attiva
            </Button>
          }
        >
          Vuoi ricevere i promemoria anche a app chiusa?
        </Alert>
      </Snackbar>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')}>
        <Alert severity="success">{snack}</Alert>
      </Snackbar>
    </>
  );
}
