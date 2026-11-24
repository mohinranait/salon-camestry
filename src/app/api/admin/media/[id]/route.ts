import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { getSession } from '@/lib/server/auth';
import { deleteGridFile, findMediaUsage, MAX_UPLOAD_BYTES, replaceMediaFile, toMediaItem } from '@/lib/server/media';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function guard({ params }: Ctx) {
  if (!(await getSession())) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { id } = await params;
  if (!ObjectId.isValid(id)) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  return { id };
}

export async function GET(_request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  const row = await db.orm.media.where({ id: g.id }).first();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item: toMediaItem(row), usage: await findMediaUsage(g.id) });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  defaultAlt: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  const row = await db.orm.media.where({ id: g.id }).update(parsed.data);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item: toMediaItem(row) });
}

/** Replaces the file but keeps the media id, so every placement updates. */
export async function PUT(request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  const file = (await request.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File is larger than 200 MB' }, { status: 400 });
  const row = await replaceMediaFile(g.id, Buffer.from(await file.arrayBuffer()), file.name, file.type);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item: toMediaItem(row) });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  const force = new URL(request.url).searchParams.get('force') === '1';
  const usage = await findMediaUsage(g.id);
  if (usage.length && !force) {
    return NextResponse.json({ error: 'This file is in use', usage }, { status: 409 });
  }
  const row = await db.orm.media.where({ id: g.id }).delete();
  if (row) await deleteGridFile(row.fileId);
  return NextResponse.json({ ok: true });
}
