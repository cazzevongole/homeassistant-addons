import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { StoreProvider } from '@/lib/store';
import { AppLayout } from '@/components/AppLayout';
import { XpToast } from '@/components/XpToast';
import { SyncStatus } from '@/components/SyncStatus';
import { PwaManager } from '@/components/PwaManager';
import { ReminderChecker } from '@/components/ReminderChecker';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#7c4dff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'ADHD Helper',
  description:
    'Produttività ADHD-friendly: task, focus timer, planner, abitudini e brain dump. Offline-first con sincronizzazione.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ADHD Helper' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={inter.variable}>
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          <StoreProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <XpToast />
            <SyncStatus />
            <PwaManager />
            <ReminderChecker />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
