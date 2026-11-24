// AES-256-GCM encryption for credentials stored in the database (Cloudinary
// secret, SMTP password). The key is derived from AUTH_SECRET per purpose, so
// each kind of secret has its own key.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function encryptionKey(purpose: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET must be set to store credentials');
  return createHash('sha256').update(`${purpose}:${secret}`).digest();
}

export function encryptSecret(plain: string, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(purpose), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decryptSecret(stored: string, purpose: string): string | null {
  try {
    const [iv, tag, data] = stored.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(purpose), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    // Wrong AUTH_SECRET or corrupted value: the secret has to be entered again.
    return null;
  }
}
