import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
  return NextResponse.json(allTasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTask = await db.insert(tasks).values({
    title: body.title,
    description: body.description || '',
    priority: body.priority || 'medium',
    dueDate: body.dueDate || null,
    reminder: body.reminder || null,
  }).returning();
  return NextResponse.json(newTask[0]);
}
