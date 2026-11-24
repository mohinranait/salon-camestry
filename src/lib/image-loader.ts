import { cloudinaryTransform, isCloudinaryUrl } from './cloudinary-url';

// next/image loader: Cloudinary resizes and picks the best format (AVIF/WebP)
// at its CDN, so images never pass through the Next.js server.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!isCloudinaryUrl(src)) return src;
  return cloudinaryTransform(src, `c_limit,w_${width},q_${quality ?? 'auto'},f_auto`);
}
