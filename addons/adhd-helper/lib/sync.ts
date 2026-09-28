import type { LocalData } from './local-db';

export interface SyncResult {
  ok: boolean;
  pulled: number;
  pushed: number;
  error?: string;
}

const REMOTE: Record<keyof LocalData, string> = {
  tasks: 'tasks',
  planner: 'planner_items',
  focus: 'focus_sessions',
  habits: 'habits',
  habit_logs: 'habit_logs',
  notes: 'notes',
};

/** Push pending local mutations, then pull everything down. Simple & robust. */
export async function syncNow(userId: string): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, pulled: 0, pushed: 0, error: 'offline' };
  }

  const { getSupabaseBrowser } = await import('./supabase-browser');
  const { getPendingOps, setPendingOps, loadLocalData, saveLocalData, setLastSync } =
    await import('./local-db');
  const supabase = getSupabaseBrowser();

  let pushed = 0;

  // 1. PUSH: apply pending ops in order
  const pending = await getPendingOps();
  const remaining = [];
  for (const op of pending) {
    const remote = REMOTE[op.table as keyof LocalData];
    if (!remote) continue;
    try {
      if (op.op === 'delete') {
        const { error } = await supabase.from(remote).delete().eq('id', op.row.id as string);
        if (error) throw error;
      } else {
        const payload = { ...op.row };
        delete payload.user_id;
        if (op.op === 'insert') {
          const { error } = await supabase.from(remote).insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(remote).update(payload).eq('id', op.row.id as string);
          if (error) throw error;
        }
      }
      pushed++;
    } catch {
      remaining.push(op); // keep for retry
    }
  }
  await setPendingOps(remaining);

  // 2. PULL: fresh copy of everything
  try {
    const [tasks, planner, focus, habits, habitLogs, notes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('planner_items').select('*').order('date'),
      supabase.from('focus_sessions').select('*').order('started_at'),
      supabase.from('habits').select('*').order('created_at'),
      supabase.from('habit_logs').select('*').order('date'),
      supabase.from('notes').select('*').order('updated_at'),
    ]);

    const data: LocalData = {
      tasks: tasks.data ?? [],
      planner: planner.data ?? [],
      focus: focus.data ?? [],
      habits: habits.data ?? [],
      habit_logs: habitLogs.data ?? [],
      notes: notes.data ?? [],
    };

    // Preserve rows that are still pending locally (not yet pushed)
    const pendingIds = new Set(remaining.map((op) => String(op.row.id)));
    const local = await loadLocalData();
    for (const key of Object.keys(REMOTE) as (keyof LocalData)[]) {
      const localRows = (local[key] as { id: string }[]).filter((r) => pendingIds.has(r.id));
      const known = new Set((data[key] as { id: string }[]).map((r) => r.id));
      data[key] = [...(data[key] as { id: string }[]), ...localRows.filter((r) => !known.has(r.id))];
    }

    await saveLocalData(data);
    await setLastSync(new Date().toISOString());
    return { ok: true, pulled: Object.values(data).reduce((n, arr) => n + arr.length, 0), pushed };
  } catch (e) {
    return { ok: false, pulled: 0, pushed, error: e instanceof Error ? e.message : 'sync error' };
  }
}

/** Initial full pull for a fresh login. */
export async function fullPull(userId: string): Promise<SyncResult> {
  return syncNow(userId);
}
