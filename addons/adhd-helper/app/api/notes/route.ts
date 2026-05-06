import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allNotes = await db.select().from(notes).orderBy(notes.pinned, notes.updatedAt);
  return NextResponse.json(allNotes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newNote = await db.insert(notes).values({
    title: body.title,
    content: body.content,
    pinned: body.pinned || false,
  }).returning();
  return NextResponse.json(newNote[0]);
}
