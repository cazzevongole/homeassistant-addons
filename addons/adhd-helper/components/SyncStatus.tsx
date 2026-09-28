'use client';

import { Tooltip, Box, Typography } from '@mui/material';
import { CloudOff, CloudDone, CloudUpload, Sync } from '@mui/icons-material';
import { useStore } from '@/lib/store';

export function SyncStatus() {
  const { online, syncing, pendingCount, lastSync } = useStore();

  if (!online) {
    return (
      <Tooltip title="Offline — le modifiche sono salvate sul dispositivo">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
          <CloudOff fontSize="small" />
          <Typography variant="caption" sx={{ display: { xs: 'none', md: 'inline' } }}>Offline</Typography>
        </Box>
      </Tooltip>
    );
  }

  if (syncing) {
    return (
      <Tooltip title="Sincronizzazione…">
        <Sync fontSize="small" color="primary" className="spin" />
      </Tooltip>
    );
  }

  if (pendingCount > 0) {
    return (
      <Tooltip title={`${pendingCount} modifiche in attesa di sincronizzazione`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'info.main' }}>
          <CloudUpload fontSize="small" />
          <Typography variant="caption">{pendingCount}</Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={lastSync ? `Sincronizzato: ${new Date(lastSync).toLocaleTimeString('it-IT')}` : 'Sincronizzato'}>
      <CloudDone fontSize="small" color="success" />
    </Tooltip>
  );
}
