import { NextResponse } from 'next/server';
import { db } from '@/db';
import { habits } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allHabits = await db.select().from(habits).orderBy(habits.createdAt);
  return NextResponse.json(allHabits);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newHabit = await db.insert(habits).values({
    name: body.name,
    description: body.description || '',
    frequency: body.frequency || 'daily',
    targetDays: body.targetDays || '',
  }).returning();
  return NextResponse.json(newHabit[0]);
}
