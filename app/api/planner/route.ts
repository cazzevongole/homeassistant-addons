import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plannerItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const query = db.select().from(plannerItems);
  if (date) {
    const items = await query.where(eq(plannerItems.date, date)).orderBy(plannerItems.startTime);
    return NextResponse.json(items);
  }
  const items = await query.orderBy(plannerItems.date, plannerItems.startTime);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newItem = await db.insert(plannerItems).values({
    title: body.title,
    startTime: body.startTime,
    endTime: body.endTime,
    date: body.date,
    taskId: body.taskId || null,
  }).returning();
  return NextResponse.json(newItem[0]);
}
