import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  const due: { title: string; body: string; tag: string; url: string }[] = [];

  // Tasks with an active reminder that fired
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, reminder_at, notified')
    .eq('user_id', user.id)
    .eq('notified', false)
    .not('reminder_at', 'is', null)
    .lte('reminder_at', now);

  for (const t of tasks ?? []) {
    due.push({
      title: `⏰ ${t.title}`,
      body: t.description || 'Promemoria attività',
      tag: `task-${t.id}`,
      url: '/tasks',
    });
    await supabase.from('tasks').update({ notified: true }).eq('id', t.id);
  }

  // Planner blocks starting within the next minute window (±5 min ahead handled client-side)
  const { data: planner } = await supabase
    .from('planner_items')
    .select('id, title, start_time, date')
    .eq('user_id', user.id)
    .eq('completed', false)
    .gte('date', new Date().toISOString().slice(0, 10));

  for (const p of planner ?? []) {
    const start = new Date(`${p.date}T${p.start_time}:00`);
    const diff = start.getTime() - Date.now();
    if (diff > 0 && diff <= 5 * 60_000) {
      due.push({
        title: `📅 Tra poco: ${p.title}`,
        body: `Inizio alle ${p.start_time}`,
        tag: `planner-${p.id}-${p.date}`,
        url: '/planner',
      });
    }
  }

  return NextResponse.json(due);
}
