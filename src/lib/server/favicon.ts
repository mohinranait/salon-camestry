import 'server-only';
import { cloudinaryTransform } from '@/lib/cloudinary-url';
import type { ResolvedMediaRef } from '@/lib/types';
import { getSettings } from './data';

/** Square PNG renditions of the favicon chosen in Settings → General, or null when none is set. */
export async function faviconUrls() {
  try {
    const settings = await getSettings();
    const url = (settings.general.favicon as ResolvedMediaRef | null)?.media?.url;
    if (!url) return null;
    const square = (size: number) => cloudinaryTransform(url, `c_fill,g_center,w_${size},h_${size},f_png`);
    return { icon32: square(32), icon192: square(192), apple: square(180), ico: square(48) };
  } catch {
    // No database (e.g. while building): pages render without a favicon.
    return null;
  }
}
