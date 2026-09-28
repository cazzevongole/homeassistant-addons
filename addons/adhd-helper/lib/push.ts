'use client';

import { getSupabaseBrowser } from './supabase-browser';

export async function isPushSupported(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function currentPushEnabled(): Promise<boolean> {
  if (!(await isPushSupported())) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPushSupported())) return { ok: false, reason: 'Push non supportato da questo browser' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'Permesso notifiche negato' };

  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return { ok: false, reason: 'Chiave push non configurata (NEXT_PUBLIC_VAPID_PUBLIC_KEY)' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
    });
  }

  const json = sub.toJSON();
  const keys = (json.keys ?? {}) as { p256dh?: string; auth?: string };
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: json.endpoint!,
      p256dh: keys.p256dh!,
      auth: keys.auth!,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' },
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await supabaseDeleteEndpoint(endpoint).catch(() => {});
    await sub.unsubscribe();
  }
}

async function supabaseDeleteEndpoint(endpoint: string) {
  const supabase = getSupabaseBrowser();
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
