import 'server-only';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { CONTENT_TAG } from './data';

/** After an admin save in a Server Action: the next page view reads fresh data. */
export function expireSiteCache() {
  updateTag(CONTENT_TAG);
  revalidatePath('/', 'layout');
}

/** Same, from Route Handlers, where updateTag is not available. */
export function expireSiteCacheFromRoute() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
}
