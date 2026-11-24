import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { PageView } from '@/components/site/page-view';
import { loadPublicPage } from '@/lib/server/page-access';
import { pageMetadata } from '@/lib/server/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'home') return {};
  const { page, settings } = await loadPublicPage(slug);
  return pageMetadata(page, settings);
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  if (slug === 'home') permanentRedirect('/');
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const { page, settings, preview } = await loadPublicPage(slug);
  return <PageView page={page} settings={settings} preview={preview} />;
}
