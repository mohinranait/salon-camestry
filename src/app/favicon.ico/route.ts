import { faviconUrls } from '@/lib/server/favicon';

export const dynamic = 'force-dynamic';

// Browsers and crawlers request /favicon.ico directly, so it follows the favicon set in the admin panel.
export async function GET() {
  const urls = await faviconUrls();
  if (!urls) return new Response(null, { status: 404 });
  return new Response(null, {
    status: 307,
    headers: { Location: urls.ico, 'Cache-Control': 'public, max-age=300' },
  });
}
