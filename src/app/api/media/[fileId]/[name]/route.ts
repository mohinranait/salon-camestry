import { ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { bucket } from '@/lib/server/media';

export const dynamic = 'force-dynamic';

// Serves media library files from GridFS. The URL contains the GridFS id, so it
// never changes content and can be cached forever. Supports range requests for video.
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string; name: string }> }) {
  const { fileId } = await params;
  if (!ObjectId.isValid(fileId)) return new Response('Not found', { status: 404 });

  const id = new ObjectId(fileId);
  const [file] = await bucket().find({ _id: id }).limit(1).toArray();
  if (!file) return new Response('Not found', { status: 404 });

  const total = file.length;
  const contentType = (file.metadata?.contentType as string | undefined) ?? 'application/octet-stream';
  const headers = new Headers({
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: `"${fileId}"`,
  });
  if (contentType === 'image/svg+xml') headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");

  if (request.headers.get('if-none-match') === `"${fileId}"`) {
    return new Response(null, { status: 304, headers });
  }

  const range = request.headers.get('range');
  const match = range?.match(/bytes=(\d*)-(\d*)/);
  if (match && total > 0) {
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : total - 1;
    if (!match[1] && match[2]) {
      start = Math.max(0, total - Number(match[2]));
      end = total - 1;
    }
    end = Math.min(end, total - 1);
    if (start > end || start >= total) {
      headers.set('Content-Range', `bytes */${total}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    headers.set('Content-Length', String(end - start + 1));
    const stream = bucket().openDownloadStream(id, { start, end: end + 1 });
    return new Response(Readable.toWeb(stream) as ReadableStream, { status: 206, headers });
  }

  headers.set('Content-Length', String(total));
  const stream = bucket().openDownloadStream(id);
  return new Response(Readable.toWeb(stream) as ReadableStream, { status: 200, headers });
}
