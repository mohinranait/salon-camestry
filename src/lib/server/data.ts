import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { db } from '@/prisma/db';
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from '@/lib/settings';
import { resolveMedia } from './media';
import type {
  BookingDoc,
  LeadDoc,
  MemberDoc,
  MilestoneDoc,
  PageDoc,
  SectionInstance,
  SuiteDoc,
} from '@/lib/types';

export const SETTINGS_KEY = 'site';

/**
 * Every public read is kept in the Next.js data cache under this tag, so pages
 * render without touching the database. Admin saves expire the tag (see
 * `expireSiteCache`), and the hourly revalidate covers edits made outside the
 * admin panel, such as the seed script.
 */
export const CONTENT_TAG = 'site-content';

function cachedRead<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) {
  // React's cache() dedupes within one request; unstable_cache shares results across requests.
  return cache(unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: 3600 }));
}

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : '');

/** Raw settings as stored (media unresolved) — what the admin form edits. */
export async function getRawSettings(): Promise<SiteSettings> {
  const row = await db.orm.settings.where({ key: SETTINGS_KEY }).first();
  return mergeSettings(DEFAULT_SETTINGS, row?.data ?? {});
}

/** Settings for rendering the site, with media resolved and secrets removed. */
export const getSettings = cachedRead(async (): Promise<SiteSettings> => {
  const settings = await getRawSettings();
  // The Instagram token is only read server-side by the feed section.
  return resolveMedia({ ...settings, instagram: { accessToken: '' } });
}, 'settings');

/** The Instagram token, kept out of the settings sent to pages. */
export const getInstagramToken = cachedRead(async () => (await getRawSettings()).instagram.accessToken, 'instagram-token');

type PageRow = Awaited<ReturnType<typeof db.orm.pages.create>>;

export function toPageDoc(row: PageRow): PageDoc {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as PageDoc['status'],
    availability: row.availability as PageDoc['availability'],
    sections: (Array.isArray(row.sections) ? row.sections : []) as SectionInstance[],
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: row.ogImage ?? null,
    noIndex: row.noIndex,
    order: row.order,
    updatedAt: iso(row.updatedAt),
  };
}

export const getPageBySlug = cachedRead(async (slug: string): Promise<PageDoc | null> => {
  const row = await db.orm.pages.where({ slug }).first();
  if (!row) return null;
  return resolveMedia(toPageDoc(row));
}, 'page');

export const listPages = cachedRead(async (): Promise<PageDoc[]> => {
  const rows = await db.orm.pages.orderBy({ order: 1 }).all();
  return rows.map(toPageDoc);
}, 'pages');

type MilestoneRow = Awaited<ReturnType<typeof db.orm.milestones.create>>;
export function toMilestoneDoc(row: MilestoneRow): MilestoneDoc {
  return {
    id: row.id,
    title: row.title,
    dateLabel: row.dateLabel,
    status: row.status as MilestoneDoc['status'],
    caption: row.caption,
    gallery: [...(row.gallery ?? [])],
    order: row.order,
  };
}

export const getMilestones = cachedRead(async (): Promise<MilestoneDoc[]> => {
  const rows = await db.orm.milestones.orderBy({ order: 1 }).all();
  return resolveMedia(rows.map(toMilestoneDoc));
}, 'milestones');

type SuiteRow = Awaited<ReturnType<typeof db.orm.suites.create>>;
export function toSuiteDoc(row: SuiteRow): SuiteDoc {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    wetDry: row.wetDry,
    count: row.count,
    available: row.available,
    sqft: row.sqft,
    priceLabel: row.priceLabel,
    summary: row.summary,
    description: row.description,
    features: [...(row.features ?? [])],
    image: row.image ?? null,
    gallery: [...(row.gallery ?? [])],
    published: row.published,
    order: row.order,
  };
}

export const getSuites = cachedRead(async (publishedOnly: boolean = true): Promise<SuiteDoc[]> => {
  const query = publishedOnly ? db.orm.suites.where({ published: true }) : db.orm.suites;
  const rows = await query.orderBy({ order: 1 }).all();
  return resolveMedia(rows.map(toSuiteDoc));
}, 'suites');

type MemberRow = Awaited<ReturnType<typeof db.orm.members.create>>;
export function toMemberDoc(row: MemberRow): MemberDoc {
  return {
    id: row.id,
    name: row.name,
    businessName: row.businessName,
    suiteNumber: row.suiteNumber,
    specialty: row.specialty,
    headshot: row.headshot ?? null,
    bio: row.bio,
    instagram: row.instagram,
    bookingUrl: row.bookingUrl,
    published: row.published,
    featured: row.featured,
    order: row.order,
  };
}

export const getMembers = cachedRead(async (publishedOnly: boolean = true): Promise<MemberDoc[]> => {
  const query = publishedOnly ? db.orm.members.where({ published: true }) : db.orm.members;
  const rows = await query.orderBy({ order: 1 }).all();
  return resolveMedia(rows.map(toMemberDoc));
}, 'members');

type LeadRow = Awaited<ReturnType<typeof db.orm.leads.create>>;
export function toLeadDoc(row: LeadRow): LeadDoc {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    specialty: row.specialty,
    suiteSize: row.suiteSize,
    suiteType: row.suiteType,
    moveIn: row.moveIn,
    message: row.message,
    status: row.status as LeadDoc['status'],
    notes: row.notes,
    emailStatus: row.emailStatus,
    createdAt: iso(row.createdAt),
  };
}

type BookingRow = Awaited<ReturnType<typeof db.orm.bookings.create>>;
export function toBookingDoc(row: BookingRow): BookingDoc {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    specialty: row.specialty,
    date: row.date,
    time: row.time,
    notes: row.notes,
    status: row.status as BookingDoc['status'],
    emailStatus: row.emailStatus,
    createdAt: iso(row.createdAt),
  };
}

/** Share of the build that is done: completed milestones count fully, in-progress ones half. */
export function buildProgress(milestones: MilestoneDoc[]) {
  if (milestones.length === 0) return 0;
  const score = milestones.reduce(
    (sum, m) => sum + (m.status === 'completed' ? 1 : m.status === 'in-progress' ? 0.5 : 0),
    0,
  );
  return Math.round((score / milestones.length) * 100);
}
