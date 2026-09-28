'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Button, Card, CardContent, CircularProgress, Typography, Alert,
} from '@mui/material';
import { Login } from '@mui/icons-material';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize the session when arriving with tokens in the URL hash
  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      const supabase = getSupabaseBrowser();
      supabase.auth.getSession().then(() => {
        setLoading(true);
        router.replace(returnTo);
      });
    }
  }, [returnTo, router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ textAlign: 'center', py: 5, px: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
            ADHD Helper
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Task, focus, abitudini e note — offline-first, con XP e streak.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Login />}
            onClick={signInWithGoogle}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Accesso…' : 'Accedi con Google'}
          </Button>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3 }}>
            Funziona anche offline: i dati restano sul dispositivo e si sincronizzano appena torni online.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
