import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await db.select().from(tasks).where(eq(tasks.id, parseInt(id)));
  if (task.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(task[0]);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await db.update(tasks)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, parseInt(id)))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await db.delete(tasks).where(eq(tasks.id, parseInt(id))).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(deleted[0]);
}
