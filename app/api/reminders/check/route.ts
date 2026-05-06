import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, lte, isNotNull } from 'drizzle-orm';

export async function GET() {
  const now = new Date().toISOString();
  const dueReminders = await db
    .select()
    .from(tasks)
    .where(
      lte(tasks.reminder, now)
    );

  const unnotified = dueReminders.filter(t => !t.notified && t.reminder);

  if (unnotified.length > 0) {
    for (const task of unnotified) {
      await db
        .update(tasks)
        .set({ notified: true })
        .where(eq(tasks.id, task.id));
    }
  }

  return NextResponse.json(unnotified);
}
