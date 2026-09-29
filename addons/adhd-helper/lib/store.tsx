'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  EntityKind, FocusSession, GoogleState, GoogleSyncSummary, Habit, HabitLog, Note, PendingOp,
  PlannerItem, Profile, SyncOp, Task,
} from './types';
import { levelForXp } from './types';
import {
  clearUserData, getPendingOps, getXpSeen, loadLocalData, queueOp, saveLocalData, setXpSeen,
  type LocalData,
} from './local-db';
import { syncNow } from './sync';
import { getSupabaseBrowser } from './supabase-browser';

interface StoreState {
  session: Session | null;
  loading: boolean;
  online: boolean;
  syncing: boolean;
  lastSync: string | null;
  pendingCount: number;
  data: LocalData;
  profile: Profile | null;
  xpToast: { amount: number; key: number } | null;
  levelUp: number | null;
  google: GoogleState;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  signOut: () => Promise<void>;
  mutate: (table: EntityKind, op: SyncOp, row: Record<string, unknown>) => Promise<void>;
  syncGoogle: (force?: boolean) => Promise<GoogleSyncSummary | null>;
  refreshGoogle: () => Promise<void>;
  connectGoogle: () => void;
  disconnectGoogle: () => Promise<void>;
}

/** Frequenza massima di una passata verso Google (il piano cambia ogni tanto). */
const GOOGLE_MIN_INTERVAL_MS = 60_000;

const EMPTY_GOOGLE: GoogleState = {
  configured: false,
  connected: false,
  email: null,
  calendarId: 'primary',
  lastSyncAt: null,
  lastError: null,
  syncing: false,
  summary: null,
};

const StoreContext = createContext<StoreState | null>(null);

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [data, setData] = useState<LocalData>({ tasks: [], planner: [], focus: [], habits: [], habit_logs: [], notes: [] });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [google, setGoogle] = useState<GoogleState>(EMPTY_GOOGLE);
  const lastProfileXp = useRef<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);
  const googleConnected = useRef(false);
  const googleBusy = useRef(false);
  const lastGoogleRun = useRef(0);

  // ---- load cached data on mount (instant paint, offline-friendly) ----
  useEffect(() => {
    const onLine = typeof navigator === 'undefined' ? true : navigator.onLine;
    const t = setTimeout(() => {
      setOnline(onLine);
    }, 0);
    loadLocalData().then((d) => {
      setTimeout(() => setData(d), 0);
    });
    return () => clearTimeout(t);
  }, []);

  // ---- auth bootstrap + session persistence ----
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, s: Session | null) => {
        setSession(s);
      if (!s) {
        clearUserData().then(() =>
          setData({ tasks: [], planner: [], focus: [], habits: [], habit_logs: [], notes: [] }),
        );
        setProfile(null);
        lastProfileXp.current = null;
      }
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- Google Calendar / Tasks ----
  const loadGoogleStatus = useCallback(async () => {
    if (!session?.user) {
      setGoogle(EMPTY_GOOGLE);
      googleConnected.current = false;
      return;
    }
    try {
      const res = await fetch('/api/google/status');
      if (!res.ok) return;
      const info = (await res.json()) as GoogleState;
      setGoogle((g) => ({ ...g, ...info, syncing: false }));
      googleConnected.current = Boolean(info.connected);
    } catch {
      // offline: lo stato resta com'era, la sync Google ripartirà dopo.
    }
  }, [session?.user?.id]);

  /**
   * Push verso Google (task → Google Tasks, abitudini → task ricorrenti,
   * planner → Calendar) + pull delle sole completature.
   */
  const syncGoogle = useCallback(
    async (force = false): Promise<GoogleSyncSummary | null> => {
      if (!session?.user || googleBusy.current) return null;
      if (!force && Date.now() - lastGoogleRun.current < GOOGLE_MIN_INTERVAL_MS) return null;
      googleBusy.current = true;
      lastGoogleRun.current = Date.now();
      setGoogle((g) => ({ ...g, syncing: true }));
      try {
        const res = await fetch('/api/google/sync', { method: 'POST' });
        const summary = (await res.json()) as GoogleSyncSummary;
        setGoogle((g) => ({
          ...g,
          syncing: false,
          connected: summary.connected !== false,
          lastError: summary.error ?? null,
          lastSyncAt: summary.ok ? new Date().toISOString() : g.lastSyncAt,
          summary,
        }));
        return summary;
      } catch {
        setGoogle((g) => ({ ...g, syncing: false }));
        return null;
      } finally {
        googleBusy.current = false;
      }
    },
    [session?.user?.id],
  );

  const connectGoogle = useCallback(() => {
    window.location.assign('/api/google/connect');
  }, []);

  const disconnectGoogle = useCallback(async () => {
    await fetch('/api/google/status', { method: 'DELETE' });
    googleConnected.current = false;
    setGoogle({ ...EMPTY_GOOGLE, configured: true });
  }, []);

  const syncLocal = useCallback(async () => {
    if (!session?.user || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    const res = await syncNow(session.user.id);
    if (res.ok) {
      const local = await loadLocalData();
      setData(local);
      setPendingCount((await getPendingOps()).length);
      setLastSync(new Date().toISOString());
    }
    syncingRef.current = false;
    setSyncing(false);
  }, [session?.user?.id]);

  // Dopo il sync locale, se l'utente ha collegato Google si prova a esportare
  // quello che è appena cambiato (throttled, in silenzio se non connesso).
  const sync = useCallback(async () => {
    await syncLocal();
    if (!googleConnected.current || !navigator.onLine) return;
    const summary = await syncGoogle();
    // Le completature arrivate da Google stanno già in Postgres: un secondo
    // passaggio locale le porta in IndexedDB. Nessun loop: qui si chiama syncLocal.
    if (summary?.ok && summary.tasksCompleted > 0) await syncLocal();
  }, [syncLocal, syncGoogle]);

  // ---- initial sync after login ----
  useEffect(() => {
    if (!session?.user) return;
    const t = setTimeout(() => {
      loadGoogleStatus();
      sync();
    }, 0);
    getPendingOps().then((ops) => setPendingCount(ops.length));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // ---- realtime profile (XP / level / streak) ----
  useEffect(() => {
    if (!session?.user) return;
    const supabase = getSupabaseBrowser();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data: p }: { data: unknown }) => {
        if (p) setProfile(p as unknown as Profile);
      });

    channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const next = payload.new as unknown as Profile;
          setProfile(next);
          const prev = lastProfileXp.current;
          if (prev !== null && next.xp > prev) {
            setXpToast({ amount: next.xp - prev, key: Date.now() });
            if (levelForXp(prev) < next.level) setLevelUp(next.level);
          }
          lastProfileXp.current = next.xp;
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // ---- online/offline listeners + periodic + on-reconnect sync ----
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (session?.user) sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && session?.user) sync();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && session?.user) sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session?.user?.id, sync]);

  // ---- debounced background sync after local mutations ----
  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => { sync(); }, 2500);
  }, [sync]);

  // ---- flush pending mutations on hide/close (don't lose ops queued <2.5s before exit) ----
  useEffect(() => {
    const flush = () => {
      if (!session?.user || !navigator.onLine) return;
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      // Best effort: fire the sync now; fires on tab hide/app background/close.
      // Most browsers keep the page alive a few seconds on hide — enough for the push.
      getPendingOps().then((ops) => {
        if (ops.length > 0) sync();
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [session?.user?.id, sync]);

  const mutate = useCallback(
    async (table: EntityKind, op: SyncOp, row: Record<string, unknown>) => {
      // 1. optimistic local update
      const local = await loadLocalData();
      const arr = [...(local[table] as unknown as { id: string }[])];
      if (op === 'delete') {
        const idx = arr.findIndex((r) => String(r.id) === String(row.id));
        if (idx >= 0) arr.splice(idx, 1);
      } else {
        const idx = arr.findIndex((r) => String(r.id) === String(row.id));
        if (idx >= 0) arr[idx] = row as unknown as { id: string };
        else arr.push(row as unknown as { id: string });
      }
      local[table] = arr;
      await saveLocalData(local);
      setData(local);

      // 2. queue for sync
      await queueOp(table, op, row);
      setPendingCount((c) => c + 1);
      scheduleSync();
    },
    [scheduleSync],
  );

  const refresh = useCallback(async () => {
    const local = await loadLocalData();
    setData(local);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
  }, []);

  // ---- mark XP toast as seen ----
  useEffect(() => {
    if (xpToast && profile) setXpSeen(profile.xp);
  }, [xpToast, profile]);

  const value = useMemo<StoreState>(
    () => ({
      session, loading, online, syncing, lastSync, pendingCount,
      data, profile, xpToast, levelUp,      google, refresh, sync, signOut, mutate,
      syncGoogle, refreshGoogle: loadGoogleStatus, connectGoogle, disconnectGoogle,
    }),
    [session, loading, online, syncing, lastSync, pendingCount, data, profile, xpToast, levelUp,
      google, refresh, sync, signOut, mutate, syncGoogle, loadGoogleStatus, connectGoogle, disconnectGoogle],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ---------- typed helpers ----------

export function useTasks() {
  const { data, mutate } = useStore();
  const tasks = data.tasks as Task[];
  return {
    tasks,
    saveTask: (t: Partial<Task> & { id?: string }) => {
      const id = t.id ?? uuid();
      const existing = tasks.find((x) => x.id === id);
      const row: Task = {
        id,
        title: t.title ?? '',
        description: t.description ?? '',
        completed: t.completed ?? false,
        completed_at: t.completed_at ?? null,
        priority: t.priority ?? 'medium',
        due_date: t.due_date ?? null,
        reminder_at: t.reminder_at ?? null,
        notified: t.notified ?? false,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // il legame con Google va conservato, altrimenti la riga viene riesportata
        google_task_id: existing?.google_task_id ?? null,
        google_task_synced_at: existing?.google_task_synced_at ?? null,
      };
      return mutate('tasks', existing ? 'update' : 'insert', row as unknown as Record<string, unknown>);
    },
    deleteTask: (id: string) => mutate('tasks', 'delete', { id }),
    setDone: (t: Task, completed: boolean) =>
      mutate('tasks', 'update', {
        ...t, completed, completed_at: completed ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>),
  };
}

export function usePlanner() {
  const { data, mutate } = useStore();
  const items = data.planner as PlannerItem[];
  return {
    items,
    saveItem: (t: Partial<PlannerItem> & { id?: string }) => {
      const id = t.id ?? uuid();
      const existing = items.find((x) => x.id === id);
      const row: PlannerItem = {
        id,
        title: t.title ?? '',
        date: t.date ?? '',
        start_time: t.start_time ?? '09:00',
        end_time: t.end_time ?? '10:00',
        completed: t.completed ?? false,
        completed_at: t.completed_at ?? null,
        task_id: t.task_id ?? null,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        google_event_id: existing?.google_event_id ?? null,
        google_event_synced_at: existing?.google_event_synced_at ?? null,
      };
      return mutate('planner', existing ? 'update' : 'insert', row as unknown as Record<string, unknown>);
    },
    deleteItem: (id: string) => mutate('planner', 'delete', { id }),
  };
}

export function useHabits() {
  const { data, mutate } = useStore();
  const habits = (data.habits as Habit[]).filter((h) => !h.archived);
  const logs = data.habit_logs as HabitLog[];
  return {
    habits, logs,
    saveHabit: (t: Partial<Habit> & { id?: string }) => {
      const id = t.id ?? uuid();
      const existing = (data.habits as Habit[]).find((x) => x.id === id);
      const row: Habit = {
        id, name: t.name ?? '', description: t.description ?? '',
        color: t.color ?? '#7c4dff', archived: false,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        google_task_id: existing?.google_task_id ?? null,
        google_recurrence: existing?.google_recurrence ?? 'RRULE:FREQ=DAILY',
        google_task_synced_at: existing?.google_task_synced_at ?? null,
      };
      return mutate('habits', existing ? 'update' : 'insert', row as unknown as Record<string, unknown>);
    },
    deleteHabit: (id: string) => mutate('habits', 'delete', { id }),
    toggleLog: (habitId: string, date: string) => {
      const existing = logs.find((l) => l.habit_id === habitId && l.date === date);
      if (existing) {
        return mutate('habit_logs', 'delete', { id: existing.id });
      }
      const row: HabitLog = {
        id: uuid(), habit_id: habitId, date, completed: true, created_at: new Date().toISOString(),
      };
      return mutate('habit_logs', 'insert', row as unknown as Record<string, unknown>);
    },
  };
}

export function useFocusSessions() {
  const { data, mutate } = useStore();
  const sessions = data.focus as FocusSession[];
  return {
    sessions,
    addSession: (s: { duration: number; label: string; completed: boolean; started_at: string; ended_at: string | null }) => {
      const row: FocusSession = { id: uuid(), ...s, created_at: new Date().toISOString() };
      return mutate('focus', 'insert', row as unknown as Record<string, unknown>);
    },
    deleteSession: (id: string) => mutate('focus', 'delete', { id }),
  };
}

export function useNotes() {
  const { data, mutate } = useStore();
  const notes = data.notes as Note[];
  return {
    notes,
    saveNote: (t: Partial<Note> & { id?: string }) => {
      const id = t.id ?? uuid();
      const existing = notes.find((x) => x.id === id);
      const row: Note = {
        id, title: t.title ?? '', content: t.content ?? '', pinned: t.pinned ?? existing?.pinned ?? false,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mutate('notes', existing ? 'update' : 'insert', row as unknown as Record<string, unknown>);
    },
    deleteNote: (id: string) => mutate('notes', 'delete', { id }),
  };
}
