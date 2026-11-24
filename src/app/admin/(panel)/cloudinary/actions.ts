'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { requireAdmin } from '@/lib/server/auth';
import {
  CLOUDINARY_SETTINGS_KEY, DEFAULT_FOLDER, decryptSecret, encryptSecret, parseStoredConfig, pingCloudinary,
} from '@/lib/cloudinary';
import type { ActionResult } from '@/app/admin/actions';

const schema = z.object({
  enabled: z.boolean(),
  cloudName: z.string().trim().max(100).regex(/^[a-zA-Z0-9_-]*$/, 'Cloud name may only contain letters, numbers, dashes and underscores'),
  apiKey: z.string().trim().max(100).regex(/^\d*$/, 'The API key is a number, as shown in your Cloudinary dashboard'),
  // Empty means "keep the saved secret".
  apiSecret: z.string().trim().max(200),
  folder: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-zA-Z0-9_\-/]*$/, 'Folder may only contain letters, numbers, dashes, underscores and slashes')
    .transform((v) => v.replace(/^\/+|\/+$/g, '') || DEFAULT_FOLDER),
});

export type CloudinaryInput = z.input<typeof schema>;

async function storedConfig() {
  const row = await db.orm.settings.where({ key: CLOUDINARY_SETTINGS_KEY }).first();
  return parseStoredConfig(row?.data);
}

/** Resolves the secret to test or save: the one typed now, else the saved one. */
async function resolveSecret(typed: string) {
  if (typed) return typed;
  const saved = (await storedConfig()).apiSecretEncrypted;
  return saved ? decryptSecret(saved) : null;
}

export async function testCloudinary(input: CloudinaryInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' };
  const { cloudName, apiKey } = parsed.data;
  const apiSecret = await resolveSecret(parsed.data.apiSecret);
  if (!cloudName || !apiKey || !apiSecret) return { ok: false, error: 'Enter the cloud name, API key and API secret' };
  const result = await pingCloudinary({ cloudName, apiKey, apiSecret });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function saveCloudinary(input: CloudinaryInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' };
  const { enabled, cloudName, apiKey, folder } = parsed.data;
  const apiSecret = await resolveSecret(parsed.data.apiSecret);

  if (enabled) {
    if (!cloudName || !apiKey || !apiSecret) return { ok: false, error: 'Enter the cloud name, API key and API secret to turn uploads on' };
    // Refuse to save credentials that would make every upload fail.
    const check = await pingCloudinary({ cloudName, apiKey, apiSecret });
    if (!check.ok) return { ok: false, error: check.error };
  }

  const data = {
    enabled,
    cloudName,
    apiKey,
    apiSecretEncrypted: apiSecret ? encryptSecret(apiSecret) : '',
    folder,
  };
  const existing = await db.orm.settings.where({ key: CLOUDINARY_SETTINGS_KEY }).first();
  if (existing) await db.orm.settings.where({ key: CLOUDINARY_SETTINGS_KEY }).update({ data });
  else await db.orm.settings.create({ key: CLOUDINARY_SETTINGS_KEY, data });
  revalidatePath('/admin', 'layout');
  return { ok: true };
}
