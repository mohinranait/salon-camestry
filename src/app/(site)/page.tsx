import type { Metadata } from 'next';
import { PageView } from '@/components/site/page-view';
import { loadPublicPage } from '@/lib/server/page-access';
import { pageMetadata } from '@/lib/server/seo';

export async function generateMetadata(): Promise<Metadata> {
  const { page, settings } = await loadPublicPage('home');
  return pageMetadata(page, settings);
}

export default async function HomePage() {
  const { page, settings, preview } = await loadPublicPage('home');
  return <PageView page={page} settings={settings} preview={preview} />;
}
