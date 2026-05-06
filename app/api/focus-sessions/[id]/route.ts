import { NextResponse } from 'next/server';
import { db } from '@/db';
import { focusSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(focusSessions).where(eq(focusSessions.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
