import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').default(''),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  priority: text('priority').default('medium').notNull(),
  dueDate: text('due_date'),
  reminder: text('reminder'),
  notified: integer('notified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

export const focusSessions = sqliteTable('focus_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  duration: integer('duration').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  startedAt: text('started_at').default(sql`(datetime('now'))`).notNull(),
  endedAt: text('ended_at'),
  label: text('label').default(''),
});

export const plannerItems = sqliteTable('planner_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  taskId: integer('task_id'),
});

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').default(''),
  frequency: text('frequency').default('daily').notNull(),
  targetDays: text('target_days').default(''),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habits.id),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  notes: text('notes').default(''),
});

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});
