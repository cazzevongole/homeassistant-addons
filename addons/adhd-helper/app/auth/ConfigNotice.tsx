import { Alert, AlertTitle, Box } from '@mui/material';

export function ConfigNotice({ missing }: { missing: boolean }) {
  if (!missing) return null;
  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
      <Alert severity="warning">
        <AlertTitle>Configurazione incompleta</AlertTitle>
        Le variabili di Supabase non sono impostate (NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY). Vedi <strong>docs/SETUP.md</strong> per la guida.
      </Alert>
    </Box>
  );
}
