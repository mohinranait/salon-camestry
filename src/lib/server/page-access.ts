import 'server-only';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from './auth';
import { getPageBySlug, getSettings } from './data';
import { isPhaseVisible } from '@/lib/settings';

/** Loads a page for visitors; drafts and other-phase pages are only shown to signed-in admins as a preview. */
export async function loadPublicPage(slug: string) {
  await connection();
  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);
  if (!page) notFound();
  const visible = page.status === 'published' && isPhaseVisible(page.availability, settings.phase.current);
  if (!visible && !(await getSession())) notFound();
  return { page, settings, preview: !visible };
}
