import { NextResponse } from 'next/server';
import { db } from '@/db';
import { habitLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await db.update(habitLogs)
    .set(body)
    .where(eq(habitLogs.id, parseInt(id)))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await db.delete(habitLogs).where(eq(habitLogs.id, parseInt(id))).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }
  return NextResponse.json(deleted[0]);
}
