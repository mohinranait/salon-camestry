import 'server-only';
import { GridFSBucket, ObjectId } from 'mongodb';
import sharp from 'sharp';
import { MongoFieldFilter } from '@prisma/orm-mongo/query-ast/execution';
import { db, mongoDriver } from '@/prisma/db';
import type { MediaInfo, MediaItem, MediaKind } from '@/lib/types';

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

export function bucket() {
  return new GridFSBucket(mongoDriver(), { bucketName: 'media_files' });
}

export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function slugifyFilename(name: string) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `${base || 'file'}${ext ? `.${ext}` : ''}`;
}

function titleFromFilename(name: string) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\w/, (c) => c.toUpperCase());
}

export function mediaUrl(fileId: string, filename: string) {
  // The GridFS id is part of the path, so replacing a file yields a new URL and caches stay correct.
  return `/api/media/${fileId}/${encodeURIComponent(filename)}`;
}

type StoredFile = { fileId: string; width: number | null; height: number | null; blurDataUrl: string | null };

async function storeFile(buffer: Buffer, filename: string, mimeType: string): Promise<StoredFile> {
  let width: number | null = null;
  let height: number | null = null;
  let blurDataUrl: string | null = null;

  if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml') {
    try {
      const image = sharp(buffer, { failOn: 'none' }).rotate();
      const meta = await image.metadata();
      const rotated = (meta.orientation ?? 1) >= 5;
      width = (rotated ? meta.height : meta.width) ?? null;
      height = (rotated ? meta.width : meta.height) ?? null;
      const blur = await image.clone().resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
      blurDataUrl = `data:image/webp;base64,${blur.toString('base64')}`;
    } catch {
      // Unreadable metadata is not fatal; the file is still stored.
    }
  }

  const upload = bucket().openUploadStream(filename, { metadata: { contentType: mimeType } });
  await new Promise<void>((resolve, reject) => {
    upload.once('finish', () => resolve());
    upload.once('error', reject);
    upload.end(buffer);
  });

  return { fileId: upload.id.toString(), width, height, blurDataUrl };
}

export async function createMedia(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  title?: string;
  defaultAlt?: string;
  tags?: string[];
}) {
  const filename = slugifyFilename(input.originalName);
  const stored = await storeFile(input.buffer, filename, input.mimeType);
  const title = input.title?.trim() || titleFromFilename(input.originalName);
  return db.orm.media.create({
    fileId: stored.fileId,
    filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    kind: kindFromMime(input.mimeType),
    size: input.buffer.length,
    width: stored.width,
    height: stored.height,
    blurDataUrl: stored.blurDataUrl,
    title,
    defaultAlt: input.defaultAlt?.trim() || title,
    tags: input.tags ?? [],
  });
}

/** Swaps the file behind a media item; every placement keeps pointing at it. */
export async function replaceMediaFile(id: string, buffer: Buffer, originalName: string, mimeType: string) {
  const existing = await db.orm.media.where({ id }).first();
  if (!existing) throw new Error('Media not found');
  const filename = slugifyFilename(originalName);
  const stored = await storeFile(buffer, filename, mimeType);
  const updated = await db.orm.media.where({ id }).update({
    fileId: stored.fileId,
    filename,
    originalName,
    mimeType,
    kind: kindFromMime(mimeType),
    size: buffer.length,
    width: stored.width,
    height: stored.height,
    blurDataUrl: stored.blurDataUrl,
  });
  await deleteGridFile(existing.fileId);
  return updated;
}

export async function deleteGridFile(fileId: string) {
  try {
    await bucket().delete(new ObjectId(fileId));
  } catch {
    // Already gone.
  }
}

type MediaRow = Awaited<ReturnType<typeof db.orm.media.create>>;

export function toMediaInfo(row: MediaRow): MediaInfo {
  return {
    id: row.id,
    url: mediaUrl(row.fileId, row.filename),
    kind: row.kind as MediaKind,
    mimeType: row.mimeType,
    width: row.width ?? null,
    height: row.height ?? null,
    blurDataUrl: row.blurDataUrl ?? null,
    title: row.title,
  };
}

export function toMediaItem(row: MediaRow): MediaItem {
  return {
    ...toMediaInfo(row),
    filename: row.filename,
    originalName: row.originalName,
    size: row.size,
    defaultAlt: row.defaultAlt,
    tags: [...(row.tags ?? [])],
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function collectMediaIds(value: unknown, into: Set<string>) {
  if (Array.isArray(value)) {
    for (const v of value) collectMediaIds(v, into);
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.mediaId === 'string' && obj.mediaId) into.add(obj.mediaId);
    for (const v of Object.values(obj)) collectMediaIds(v, into);
  }
}

function attachMedia<T>(value: T, lookup: Map<string, MediaInfo>): T {
  if (Array.isArray(value)) return value.map((v) => attachMedia(v, lookup)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = attachMedia(v, lookup);
    if (typeof obj.mediaId === 'string') {
      const media = lookup.get(obj.mediaId);
      if (media) out.media = media;
    }
    return out as T;
  }
  return value;
}

/** Walks any data structure and attaches file details to every `{ mediaId, alt }` placement. */
export async function resolveMedia<T>(value: T): Promise<T> {
  const ids = new Set<string>();
  collectMediaIds(value, ids);
  const validIds = [...ids].filter((id) => ObjectId.isValid(id));
  if (validIds.length === 0) return value;
  const rows = await db.orm.media.where(MongoFieldFilter.in('id', validIds)).all();
  const lookup = new Map(rows.map((r) => [r.id, toMediaInfo(r)]));
  return attachMedia(value, lookup);
}

/** Strips resolved file details so only `{ mediaId, alt }` is persisted. */
export function stripResolvedMedia<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripResolvedMedia(v)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.mediaId === 'string') {
      return { mediaId: obj.mediaId, alt: typeof obj.alt === 'string' ? obj.alt : '' } as T;
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripResolvedMedia(v)])) as T;
  }
  return value;
}

export type MediaUsage = { label: string; href: string };

/** Lists every place a media item is used, so editors know what a delete affects. */
export async function findMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  const needle = `"${mediaId}"`;
  const has = (v: unknown) => JSON.stringify(v).includes(needle);
  const [pages, settings, milestones, suites, members] = await Promise.all([
    db.orm.pages.all(),
    db.orm.settings.all(),
    db.orm.milestones.all(),
    db.orm.suites.all(),
    db.orm.members.all(),
  ]);
  const usage: MediaUsage[] = [];
  for (const p of pages) if (has(p)) usage.push({ label: `Page: ${p.title}`, href: `/admin/pages/${p.id}` });
  for (const s of settings) if (has(s)) usage.push({ label: 'Site settings', href: '/admin/settings' });
  for (const m of milestones) if (has(m)) usage.push({ label: `Milestone: ${m.title}`, href: '/admin/milestones' });
  for (const s of suites) if (has(s)) usage.push({ label: `Suite: ${s.name}`, href: '/admin/suites' });
  for (const m of members) if (has(m)) usage.push({ label: `Member: ${m.name}`, href: '/admin/members' });
  return usage;
}
