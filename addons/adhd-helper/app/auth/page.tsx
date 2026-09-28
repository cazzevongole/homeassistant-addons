import { Suspense } from 'react';
import { AuthForm } from './AuthForm';
import { ConfigNotice } from './ConfigNotice';

export default function AuthPage() {
  const missing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <Suspense fallback={null}>
      <ConfigNotice missing={missing} />
      <AuthForm />
    </Suspense>
  );
}
