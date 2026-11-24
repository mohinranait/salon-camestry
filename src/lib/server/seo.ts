import 'server-only';
import type { Metadata } from 'next';
import type { SiteSettings } from '@/lib/settings';
import type { PageDoc, ResolvedMediaRef, SectionInstance } from '@/lib/types';
import { visibleSections } from '@/components/site/section-renderer';

export const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function pagePath(slug: string) {
  return slug === 'home' ? '/' : `/${slug}`;
}

export function pageMetadata(page: PageDoc, settings: SiteSettings): Metadata {
  const isHome = page.slug === 'home';
  const rawTitle = page.seoTitle || page.title;
  const title = isHome ? rawTitle || settings.seo.defaultTitle : settings.seo.titleTemplate.replace('%s', rawTitle);
  const description = page.seoDescription || settings.seo.defaultDescription;
  const fallback = settings.seo.ogImage as ResolvedMediaRef | null;
  const og = page.ogImage?.media ? page.ogImage : fallback?.media ? fallback : null;
  const ogMedia = og?.media;
  const url = `${siteUrl()}${pagePath(page.slug)}`;
  return {
    title: { absolute: title },
    description,
    keywords: settings.seo.keywords,
    alternates: { canonical: url },
    robots: page.noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: settings.general.siteName,
      locale: 'en_US',
      images: ogMedia ? [{ url: `${siteUrl()}${ogMedia.url}`, width: ogMedia.width ?? undefined, height: ogMedia.height ?? undefined, alt: og?.alt }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: ogMedia ? [`${siteUrl()}${ogMedia.url}`] : undefined },
  };
}

export function localBusinessJsonLd(settings: SiteSettings) {
  const g = settings.general;
  const image = (settings.seo.ogImage as ResolvedMediaRef | null)?.media?.url;
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${siteUrl()}/#business`,
    name: g.siteName,
    description: settings.seo.defaultDescription,
    url: siteUrl(),
    telephone: g.phone || undefined,
    email: g.email || undefined,
    image: image ? `${siteUrl()}${image}` : undefined,
    priceRange: settings.seo.priceRange || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${g.street}, ${g.suite}`,
      addressLocality: g.city,
      addressRegion: g.state,
      postalCode: g.zip,
      addressCountry: 'US',
    },
    geo:
      settings.seo.latitude && settings.seo.longitude
        ? { '@type': 'GeoCoordinates', latitude: Number(settings.seo.latitude), longitude: Number(settings.seo.longitude) }
        : undefined,
    areaServed: ['Atlanta', 'Southeast Atlanta', 'East Atlanta', 'Grant Park', 'Ormewood Park', 'Reynoldstown'],
    sameAs: [settings.social.instagramUrl, settings.social.facebookUrl, settings.social.tiktokUrl, settings.social.youtubeUrl].filter(Boolean),
  };
}

export function faqJsonLd(sections: SectionInstance[], settings: SiteSettings) {
  const questions = visibleSections(sections, settings)
    .filter((s) => s.type === 'faq')
    .flatMap((s) => (Array.isArray(s.data.items) ? (s.data.items as { question: string; answer: string }[]) : []))
    .filter((q) => q.question && q.answer);
  if (questions.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer.replace(/\*\*|\*|\[([^\]]+)\]\([^)]+\)/g, '$1') },
    })),
  };
}
