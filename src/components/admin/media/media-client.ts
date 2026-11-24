'use client';

import type { MediaItem } from '@/lib/types';

export type MediaQuery = { q?: string; kind?: string; page?: number; perPage?: number };

export async function fetchMedia(query: MediaQuery): Promise<{ items: MediaItem[]; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.kind && query.kind !== 'all') params.set('kind', query.kind);
  params.set('page', String(query.page ?? 1));
  params.set('perPage', String(query.perPage ?? 40));
  const res = await fetch(`/api/admin/media?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load the media library');
  return res.json();
}

/** Uploads files with progress reporting (fetch has no upload progress events). */
export function uploadMedia(
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<{ items: MediaItem[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ items: body.items ?? [], errors: body.errors ?? [] });
        else reject(new Error(body.errors?.join('\n') || body.error || 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
    xhr.send(form);
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf';
