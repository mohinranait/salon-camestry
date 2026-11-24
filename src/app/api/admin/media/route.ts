import { NextResponse } from 'next/server';
import { MongoAndExpr, MongoFieldFilter, MongoOrExpr } from '@prisma/orm-mongo/query-ast/execution';
import { db } from '@/prisma/db';
import { getSession } from '@/lib/server/auth';
import { CloudinaryNotConfiguredError, createMedia, getCloudinaryCredentials, MAX_UPLOAD_BYTES, toMediaItem } from '@/lib/server/media';

export const dynamic = 'force-dynamic';

const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif|svg\+xml)|video\/(mp4|webm|quicktime)|application\/pdf)$/;

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const kind = url.searchParams.get('kind') ?? 'all';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage') ?? 40)));

  const filters = [];
  if (kind === 'image' || kind === 'video' || kind === 'document') filters.push(MongoFieldFilter.eq('kind', kind));
  if (q) {
    const pattern = `(?i)${escapeRegex(q)}`;
    filters.push(
      MongoOrExpr.of([
        MongoFieldFilter.of('title', '$regex', pattern),
        MongoFieldFilter.of('originalName', '$regex', pattern),
        MongoFieldFilter.of('defaultAlt', '$regex', pattern),
        MongoFieldFilter.of('tags', '$regex', pattern),
      ]),
    );
  }
  const base = filters.length ? db.orm.media.where(MongoAndExpr.of(filters)) : db.orm.media;
  // Fetch one extra row to learn whether another page exists.
  const rows = await base
    .orderBy({ createdAt: -1 })
    .offset((page - 1) * perPage)
    .limit(perPage + 1)
    .all();
  return NextResponse.json({
    items: rows.slice(0, perPage).map(toMediaItem),
    hasMore: rows.length > perPage,
    page,
  });
}

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'No files received' }, { status: 400 });
  if (!(await getCloudinaryCredentials())) {
    return NextResponse.json({ error: new CloudinaryNotConfiguredError().message, code: 'CLOUDINARY_NOT_CONFIGURED' }, { status: 409 });
  }

  const created = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!ALLOWED.test(file.type)) {
      errors.push(`${file.name}: unsupported file type (${file.type || 'unknown'})`);
      continue;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push(`${file.name}: larger than 200 MB`);
      continue;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const row = await createMedia({ buffer, originalName: file.name, mimeType: file.type });
      created.push(toMediaItem(row));
    } catch (err) {
      errors.push(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`);
    }
  }
  return NextResponse.json({ items: created, errors }, { status: created.length ? 201 : 400 });
}
