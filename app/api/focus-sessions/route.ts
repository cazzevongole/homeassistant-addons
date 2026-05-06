import { NextResponse } from 'next/server';
import { db } from '@/db';
import { focusSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const sessions = await db.select().from(focusSessions).orderBy(focusSessions.startedAt);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newSession = await db.insert(focusSessions).values({
    duration: body.duration,
    completed: body.completed || false,
    label: body.label || '',
    endedAt: body.endedAt || null,
  }).returning();
  return NextResponse.json(newSession[0]);
}

export async function DELETE() {
  await db.delete(focusSessions);
  return NextResponse.json({ success: true });
}

