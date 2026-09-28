import { NextResponse, type NextRequest } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidSubject || !vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const now = new Date().toISOString();
  const { data: pending, error } = await admin
    .from('reminder_outbox')
    .select('*')
    .is('sent_at', null)
    .lte('due_at', now)
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let failed = 0;

  for (const item of pending ?? []) {
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', item.user_id);

    const payload = JSON.stringify({
      title: item.title,
      body: item.body,
      tag: `${item.kind}-${item.ref_id}`,
      url: item.kind === 'task' ? '/tasks' : '/planner',
    });

    const results = await Promise.allSettled(
      (subs ?? []).map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ),
      ),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        // 404/410 = subscription expired → remove it
        const statusCode = (r.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          const endpoint = (r.reason as unknown as { endpoint?: string })?.endpoint;
          if (endpoint) {
            await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
          }
        }
      }
    }

    await admin.from('reminder_outbox').update({ sent_at: new Date().toISOString() }).eq('id', item.id);
  }

  return NextResponse.json({ ok: true, sent, failed, checked: pending?.length ?? 0 });
}
