import { NextResponse } from 'next/server';
import { db } from '@/db';
import { habitLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get('habitId');
  const date = searchParams.get('date');
  const query = db.select().from(habitLogs);
  if (habitId) {
    const logs = await query.where(eq(habitLogs.habitId, parseInt(habitId))).orderBy(habitLogs.date);
    return NextResponse.json(logs);
  }
  if (date) {
    const logs = await query.where(eq(habitLogs.date, date)).orderBy(habitLogs.date);
    return NextResponse.json(logs);
  }
  const logs = await query.orderBy(habitLogs.date);
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = await db.insert(habitLogs).values({
    habitId: body.habitId,
    date: body.date,
    completed: body.completed || false,
    notes: body.notes || '',
  }).returning();
  return NextResponse.json(newLog[0]);
}
