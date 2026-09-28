export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  priority: Priority;
  due_date: string | null;      // YYYY-MM-DD
  reminder_at: string | null;   // ISO timestamp
  notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlannerItem {
  id: string;
  user_id?: string;
  title: string;
  date: string;          // YYYY-MM-DD
  start_time: string;    // HH:MM
  end_time: string;      // HH:MM
  completed: boolean;
  completed_at: string | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id?: string;
  duration: number;      // minutes
  label: string;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  user_id?: string;
  habit_id: string;
  date: string;          // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  timezone: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export type EntityKind = 'tasks' | 'planner' | 'focus' | 'habits' | 'habit_logs' | 'notes';

export type SyncOp = 'insert' | 'update' | 'delete';

export interface PendingOp {
  table: EntityKind;
  op: SyncOp;
  row: Record<string, unknown>;
}

export const XP_RULES = {
  taskLow: 8,
  taskMedium: 12,
  taskHigh: 20,
  plannerBlock: 10,
  focusSession: 15,
  habitCheck: 6,
} as const;

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1);
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 50;
}

export function levelProgress(xp: number): { level: number; pct: number; next: number } {
  const level = levelForXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, pct: Math.min(100, ((xp - cur) / (next - cur)) * 100), next };
}
