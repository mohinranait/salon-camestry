// Client-safe helpers for Cloudinary delivery URLs.

const UPLOAD_SEGMENT = /\/(image|video)\/upload\//;

export function isCloudinaryUrl(url: string) {
  return url.includes('res.cloudinary.com') && UPLOAD_SEGMENT.test(url);
}

/** Inserts a transformation (e.g. `c_fill,w_400,h_400`) right after `/upload/`. */
export function cloudinaryTransform(url: string, transformation: string) {
  if (!isCloudinaryUrl(url)) return url;
  return url.replace(UPLOAD_SEGMENT, (match) => `${match}${transformation}/`);
}

/** A still frame of a Cloudinary video, usable as a poster or thumbnail. */
export function cloudinaryVideoPoster(url: string, transformation = 'so_1,q_auto,f_jpg') {
  if (!isCloudinaryUrl(url)) return undefined;
  return cloudinaryTransform(url, transformation).replace(/\.[a-z0-9]+$/i, '.jpg');
}
