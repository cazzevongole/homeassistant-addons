'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

export function PWARegister() {
  const [refresh, setRefresh] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing!;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setRefresh(true);
            }
          });
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const refreshApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleInstall = async () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      const result = await (installPrompt as any).userChoice;
      if (result.outcome === 'accepted') {
        setInstalled(true);
      }
      setInstallPrompt(null);
    }
  };

  if (!refresh && !installPrompt) return null;

  return (
    <>
      {refresh && (
        <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="info" action={<Button color="inherit" size="small" onClick={refreshApp}>Refresh</Button>}>
            Update available
          </Alert>
        </Snackbar>
      )}
      {installPrompt && !installed && (
        <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="info" action={<Button color="inherit" size="small" onClick={handleInstall}>Install</Button>}>
            Install ADHD Helper
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
