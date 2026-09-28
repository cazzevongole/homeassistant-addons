'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Alert, Box, Typography } from '@mui/material';
import { Bolt, EmojiEvents } from '@mui/icons-material';
import { useStore } from '@/lib/store';

export function XpToast() {
  const { xpToast, levelUp } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!xpToast) return;
    const t = setTimeout(() => setOpen(true), 0);
    const t2 = setTimeout(() => setOpen(false), 3500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [xpToast]);

  const dismissLevelUp = () => {
    // Level-up toast auto-dismisses; state resets on next level change
  };

  return (
    <>
      <Snackbar
        open={open && !!xpToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: { xs: 7, sm: 2 } }}
      >
        <Alert icon={<Bolt />} severity="success" variant="filled" sx={{ alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>+{xpToast?.amount ?? 0} XP</Typography>
            <Typography variant="body2">Complimenti!</Typography>
          </Box>
        </Alert>
      </Snackbar>
      <Snackbar
        open={levelUp !== null}
        autoHideDuration={5000}
        onClose={dismissLevelUp}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: { xs: 13, sm: 9 } }}
      >
        <Alert icon={<EmojiEvents />} severity="warning" variant="filled">
          <Typography sx={{ fontWeight: 700 }}>🎉 Livello {levelUp} raggiunto!</Typography>
        </Alert>
      </Snackbar>
    </>
  );
}
