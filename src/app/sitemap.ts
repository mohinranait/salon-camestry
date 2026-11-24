import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { getSettings, listPages } from '@/lib/server/data';
import { pagePath, siteUrl } from '@/lib/server/seo';
import { isPhaseVisible } from '@/lib/settings';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [pages, settings] = await Promise.all([listPages(), getSettings()]);
  return pages
    .filter((p) => p.status === 'published' && !p.noIndex && isPhaseVisible(p.availability, settings.phase.current))
    .map((p) => ({
      url: `${siteUrl()}${pagePath(p.slug)}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: p.slug === 'build-out' ? 'weekly' : 'monthly',
      priority: p.slug === 'home' ? 1 : 0.8,
    }));
}
