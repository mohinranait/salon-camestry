// Cloudinary storage for the media library. No `server-only` import, so the
// seed script can use it too; never import it from client components.
import { randomBytes } from 'node:crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { decryptSecret as decryptSecretFor, encryptSecret as encryptSecretFor } from './secrets';

export const CLOUDINARY_SETTINGS_KEY = 'cloudinary';

/** As stored in the `settings` collection. The API secret is encrypted with AUTH_SECRET. */
export type StoredCloudinaryConfig = {
  enabled: boolean;
  cloudName: string;
  apiKey: string;
  apiSecretEncrypted: string;
  folder: string;
};

export type CloudinaryCredentials = { cloudName: string; apiKey: string; apiSecret: string; folder: string };

export const DEFAULT_FOLDER = 'shear-chemistry';

// Cloudinary secrets keep their own key, so values saved earlier still decrypt.
export const encryptSecret = (plain: string) => encryptSecretFor(plain, 'cloudinary');
export const decryptSecret = (stored: string) => decryptSecretFor(stored, 'cloudinary');

export function parseStoredConfig(data: unknown): StoredCloudinaryConfig {
  const d = (data && typeof data === 'object' ? data : {}) as Partial<StoredCloudinaryConfig>;
  return {
    enabled: Boolean(d.enabled),
    cloudName: String(d.cloudName ?? ''),
    apiKey: String(d.apiKey ?? ''),
    apiSecretEncrypted: String(d.apiSecretEncrypted ?? ''),
    folder: String(d.folder || DEFAULT_FOLDER),
  };
}

/** Usable credentials, or null when Cloudinary is off or incomplete. */
export function toCredentials(stored: StoredCloudinaryConfig): CloudinaryCredentials | null {
  if (!stored.enabled || !stored.cloudName || !stored.apiKey || !stored.apiSecretEncrypted) return null;
  const apiSecret = decryptSecret(stored.apiSecretEncrypted);
  if (!apiSecret) return null;
  return { cloudName: stored.cloudName, apiKey: stored.apiKey, apiSecret, folder: stored.folder };
}

// Credentials go with every call instead of the SDK's global config, so a
// settings change takes effect immediately and requests never share state.
function auth(c: CloudinaryCredentials) {
  return { cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true };
}

const CHUNKED_ABOVE = 20 * 1024 * 1024;

export function uploadToCloudinary(
  c: CloudinaryCredentials,
  buffer: Buffer,
  options: { filename: string; mimeType: string },
): Promise<UploadApiResponse> {
  const resourceType = options.mimeType.startsWith('video/') ? 'video' : options.mimeType.startsWith('image/') ? 'image' : 'raw';
  const base = options.filename.replace(/\.[^.]+$/, '');
  const uploadOptions = {
    ...auth(c),
    folder: c.folder,
    resource_type: resourceType as 'image' | 'video' | 'raw',
    use_filename: true,
    filename_override: base,
    unique_filename: true,
    overwrite: false,
    ...(resourceType === 'raw' ? { public_id: `${base}-${randomBytes(3).toString('hex')}${options.filename.slice(base.length)}` } : {}),
  };
  return new Promise((resolve, reject) => {
    const done = (error: unknown, result?: UploadApiResponse) => {
      if (error || !result) reject(new Error(cloudinaryError(error)));
      else resolve(result);
    };
    // Large videos go up in 20 MB chunks, which Cloudinary needs above 100 MB.
    const stream =
      buffer.length > CHUNKED_ABOVE
        ? cloudinary.uploader.upload_chunked_stream({ ...uploadOptions, chunk_size: CHUNKED_ABOVE }, done)
        : cloudinary.uploader.upload_stream(uploadOptions, done);
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(c: CloudinaryCredentials, publicId: string, resourceType: string) {
  // The SDK types omit per-call credentials, but the API accepts them.
  const options = { ...auth(c), resource_type: resourceType, invalidate: true } as unknown as Parameters<typeof cloudinary.uploader.destroy>[1];
  await cloudinary.uploader.destroy(publicId, options);
}

export async function pingCloudinary(c: Omit<CloudinaryCredentials, 'folder'>) {
  try {
    // The SDK types omit per-call credentials, but the Admin API accepts them.
    const ping = cloudinary.api.ping as (options: object) => Promise<unknown>;
    await ping({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret });
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: cloudinaryError(error) };
  }
}

export function cloudinaryError(error: unknown) {
  const e = error as { message?: string; error?: { message?: string }; http_code?: number } | undefined;
  const message = e?.error?.message ?? e?.message ?? 'Cloudinary request failed';
  if (e?.http_code === 401 || /invalid (api key|signature|cloud name)|unknown api_key|api_secret mismatch|cloud_name/i.test(message)) {
    return 'Cloudinary rejected the credentials. Check the cloud name, API key and API secret.';
  }
  return message;
}
