'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { createSession, destroySession, requireAdmin } from '@/lib/server/auth';
import { SETTINGS_KEY } from '@/lib/server/data';
import { stripResolvedMedia } from '@/lib/server/media';
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from '@/lib/settings';
import { SECTION_MAP } from '@/lib/sections/registry';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function refreshSite() {
  revalidatePath('/', 'layout');
}

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? 'Invalid data' };
  console.error(error);
  return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
}

/** Plain JSON copy, typed loosely so it fits the contract's `Json` fields. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (value: unknown): any => JSON.parse(JSON.stringify(value));

const mediaRef = z.object({ mediaId: z.string().min(1), alt: z.string().max(500) });
const phaseRule = z.enum(['all', 'phase1', 'phase2']);

/* ---------------------------------- Auth --------------------------------- */

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');
  const user = await db.orm.admin_users.where({ email }).first();
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'Email or password is incorrect' };
  }
  await db.orm.admin_users.where({ id: user.id }).update({ lastLoginAt: new Date() });
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

/* ---------------------------------- Pages -------------------------------- */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and dashes');

const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().refine((t) => t in SECTION_MAP, 'Unknown section type'),
  enabled: z.boolean(),
  phase: phaseRule,
  anchor: z.string().trim().max(60).regex(/^[a-z0-9-]*$/, 'Anchor may only contain lowercase letters, numbers and dashes'),
  theme: z.enum(['light', 'ivory', 'dark']),
  data: z.record(z.string(), z.unknown()),
});

const pageSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  slug: slugSchema,
  status: z.enum(['published', 'draft']),
  availability: phaseRule,
  sections: z.array(sectionSchema),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(320),
  ogImage: mediaRef.nullable(),
  noIndex: z.boolean(),
});

const RESERVED_SLUGS = new Set(['admin', 'api', 'home', 'sitemap.xml', 'robots.txt']);

export async function savePage(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = pageSchema.parse(stripResolvedMedia(input));
    const existing = await db.orm.pages.where({ id }).first();
    if (!existing) return { ok: false, error: 'Page not found' };
    // The home page keeps its slug; it is served at "/".
    const slug = existing.slug === 'home' ? 'home' : data.slug;
    if (slug !== existing.slug) {
      if (RESERVED_SLUGS.has(slug)) return { ok: false, error: 'That slug is reserved' };
      const clash = await db.orm.pages.where({ slug }).first();
      if (clash) return { ok: false, error: 'Another page already uses that slug' };
    }
    await db.orm.pages.where({ id }).update({ ...data, slug, sections: asJson(data.sections) });
    refreshSite();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function createPage(input: { title: string; slug: string }): Promise<ActionResult> {
  await requireAdmin();
  try {
    const title = z.string().trim().min(1, 'Title is required').max(120).parse(input.title);
    const slug = slugSchema.parse(input.slug);
    if (RESERVED_SLUGS.has(slug)) return { ok: false, error: 'That slug is reserved' };
    if (await db.orm.pages.where({ slug }).first()) return { ok: false, error: 'Another page already uses that slug' };
    const last = await db.orm.pages.orderBy({ order: -1 }).first();
    const page = await db.orm.pages.create({
      slug,
      title,
      status: 'draft',
      availability: 'all',
      sections: [
        { id: crypto.randomUUID(), type: 'pageHeader', enabled: true, phase: 'all', anchor: '', theme: 'dark', data: { eyebrow: '', heading: title, intro: '', background: null } },
      ],
      seoTitle: title,
      seoDescription: '',
      ogImage: null,
      noIndex: false,
      order: (last?.order ?? 0) + 1,
    });
    refreshSite();
    return { ok: true, id: page.id };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePage(id: string): Promise<ActionResult> {
  await requireAdmin();
  const page = await db.orm.pages.where({ id }).first();
  if (!page) return { ok: false, error: 'Page not found' };
  if (page.slug === 'home') return { ok: false, error: 'The home page cannot be deleted' };
  await db.orm.pages.where({ id }).delete();
  refreshSite();
  return { ok: true };
}

/* -------------------------------- Settings ------------------------------- */

export async function saveSettings(input: SiteSettings): Promise<ActionResult> {
  await requireAdmin();
  try {
    const clean = stripResolvedMedia(input);
    const data = mergeSettings(DEFAULT_SETTINGS, clean);
    data.booking.weekly = data.booking.weekly.map((w) => ({
      day: w.day,
      times: [...new Set(w.times.filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort(),
    }));
    data.booking.blackoutDates = data.booking.blackoutDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    const existing = await db.orm.settings.where({ key: SETTINGS_KEY }).first();
    if (existing) await db.orm.settings.where({ key: SETTINGS_KEY }).update({ data: asJson(data) });
    else await db.orm.settings.create({ key: SETTINGS_KEY, data: asJson(data) });
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Switches the site between pre-launch (Phase 1) and launch (Phase 2). */
export async function setPhase(phase: 'phase1' | 'phase2'): Promise<ActionResult> {
  await requireAdmin();
  const row = await db.orm.settings.where({ key: SETTINGS_KEY }).first();
  const data = mergeSettings(DEFAULT_SETTINGS, row?.data ?? {});
  data.phase.current = phase;
  if (row) await db.orm.settings.where({ key: SETTINGS_KEY }).update({ data: asJson(data) });
  else await db.orm.settings.create({ key: SETTINGS_KEY, data: asJson(data) });
  refreshSite();
  return { ok: true };
}

/* ------------------------------- Collections ----------------------------- */

const milestoneSchema = z.object({
  title: z.string().trim().min(1, 'Phase title is required').max(120),
  dateLabel: z.string().trim().max(60),
  status: z.enum(['completed', 'in-progress', 'upcoming']),
  caption: z.string().trim().max(2000),
  gallery: z.array(mediaRef),
});

const suiteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  size: z.enum(['single', 'double']),
  wetDry: z.enum(['wet', 'dry']),
  count: z.coerce.number().int().min(0).max(100),
  available: z.coerce.number().int().min(0).max(100),
  sqft: z.string().trim().max(40),
  priceLabel: z.string().trim().max(60),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(3000),
  features: z.array(z.string().trim().min(1)).max(30),
  image: mediaRef.nullable(),
  gallery: z.array(mediaRef),
  published: z.boolean(),
});

const memberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  businessName: z.string().trim().max(120),
  suiteNumber: z.string().trim().max(20),
  specialty: z.string().trim().min(1, 'Specialty is required').max(40),
  headshot: mediaRef.nullable(),
  bio: z.string().trim().max(1500),
  instagram: z.string().trim().max(60).transform((v) => v.replace(/^@/, '')),
  bookingUrl: z.union([z.literal(''), z.url('Booking URL must be a full link starting with https://')]),
  published: z.boolean(),
  featured: z.boolean(),
});

export type CollectionName = 'milestones' | 'suites' | 'members';

async function nextOrder(collection: CollectionName) {
  const query =
    collection === 'milestones' ? db.orm.milestones : collection === 'suites' ? db.orm.suites : db.orm.members;
  const last = await query.orderBy({ order: -1 }).select('order').first();
  return (last?.order ?? 0) + 1;
}

async function deleteById(collection: CollectionName, id: string) {
  if (collection === 'milestones') await db.orm.milestones.where({ id }).delete();
  else if (collection === 'suites') await db.orm.suites.where({ id }).delete();
  else await db.orm.members.where({ id }).delete();
}

async function setOrder(collection: CollectionName, id: string, order: number) {
  if (collection === 'milestones') await db.orm.milestones.where({ id }).update({ order });
  else if (collection === 'suites') await db.orm.suites.where({ id }).update({ order });
  else await db.orm.members.where({ id }).update({ order });
}

export async function saveCollectionItem(collection: CollectionName, id: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  try {
    const raw = stripResolvedMedia(input);
    let savedId = id;
    if (collection === 'milestones') {
      const data = milestoneSchema.parse(raw);
      if (id) await db.orm.milestones.where({ id }).update(data);
      else savedId = (await db.orm.milestones.create({ ...data, order: await nextOrder(collection) })).id;
    } else if (collection === 'suites') {
      const data = suiteSchema.parse(raw);
      if (id) await db.orm.suites.where({ id }).update(data);
      else savedId = (await db.orm.suites.create({ ...data, order: await nextOrder(collection) })).id;
    } else {
      const data = memberSchema.parse(raw);
      if (id) await db.orm.members.where({ id }).update(data);
      else savedId = (await db.orm.members.create({ ...data, order: await nextOrder(collection) })).id;
    }
    refreshSite();
    return { ok: true, id: savedId ?? undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCollectionItem(collection: CollectionName, id: string): Promise<ActionResult> {
  await requireAdmin();
  await deleteById(collection, id);
  refreshSite();
  return { ok: true };
}

export async function reorderCollection(collection: CollectionName, ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  for (const [index, id] of ids.entries()) {
    await setOrder(collection, id, index + 1);
  }
  refreshSite();
  return { ok: true };
}

/* ---------------------------- Leads & bookings --------------------------- */

const leadUpdate = z.object({
  status: z.enum(['new', 'contacted', 'toured', 'signed', 'archived']).optional(),
  notes: z.string().max(5000).optional(),
});

export async function updateLead(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.orm.leads.where({ id }).update(leadUpdate.parse(input));
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.orm.leads.where({ id }).delete();
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function updateBooking(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.orm.bookings.where({ id }).update({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).parse(status) });
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.orm.bookings.where({ id }).delete();
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

/* ---------------------------------- Users -------------------------------- */

const newUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.email('Enter a valid email').transform((v) => v.toLowerCase()),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});

export async function createAdminUser(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = newUserSchema.parse(input);
    if (await db.orm.admin_users.where({ email: data.email }).first()) {
      return { ok: false, error: 'An admin with that email already exists' };
    }
    const user = await db.orm.admin_users.create({
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: 'admin',
      lastLoginAt: null,
    });
    revalidatePath('/admin/users');
    return { ok: true, id: user.id };
  } catch (e) {
    return fail(e);
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const data = z
      .object({ current: z.string().min(1, 'Enter your current password'), next: z.string().min(10, 'New password must be at least 10 characters') })
      .parse(input);
    const user = await db.orm.admin_users.where({ id: session.sub }).first();
    if (!user || !(await bcrypt.compare(data.current, user.passwordHash))) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    await db.orm.admin_users.where({ id: user.id }).update({ passwordHash: await bcrypt.hash(data.next, 12) });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAdminUser(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (id === session.sub) return { ok: false, error: 'You cannot remove your own account' };
  await db.orm.admin_users.where({ id }).delete();
  revalidatePath('/admin/users');
  return { ok: true };
}
