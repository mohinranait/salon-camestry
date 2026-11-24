'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { requireAdmin } from '@/lib/server/auth';
import { getRawSettings } from '@/lib/server/data';
import { deliver } from '@/lib/server/email';
import {
  createSmtpTransport, decryptSmtpPassword, EMAIL_SETTINGS_KEY, encryptSmtpPassword, parseStoredEmailConfig, smtpError,
  type SmtpConfig,
} from '@/lib/email-config';
import type { ActionResult } from '@/app/admin/actions';

const schema = z.object({
  enabled: z.boolean(),
  host: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-zA-Z0-9.-]*$/, 'The SMTP server is a host name such as smtp.gmail.com'),
  port: z.coerce.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  security: z.enum(['ssl', 'starttls', 'none']),
  username: z.string().trim().max(200),
  // Empty means "keep the saved password".
  password: z.string().max(500),
  fromName: z.string().trim().max(120),
  fromEmail: z.union([z.literal(''), z.email('Enter a valid From email')]),
});

export type EmailConfigInput = z.input<typeof schema>;

async function stored() {
  const row = await db.orm.settings.where({ key: EMAIL_SETTINGS_KEY }).first();
  return parseStoredEmailConfig(row?.data);
}

/** Builds the SMTP config to use: typed values, with the saved password when none was typed. */
async function resolve(input: EmailConfigInput): Promise<{ ok: true; smtp: SmtpConfig } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' };
  const d = parsed.data;
  if (!d.host) return { ok: false, error: 'Enter the SMTP server' };
  if (!d.fromEmail) return { ok: false, error: 'Enter the From email' };
  let password = d.password;
  if (!password) {
    const saved = (await stored()).passwordEncrypted;
    const decrypted = saved ? decryptSmtpPassword(saved) : '';
    if (decrypted === null) return { ok: false, error: 'The saved password can no longer be read. Enter it again.' };
    password = decrypted;
  }
  if (d.username && !password) return { ok: false, error: 'Enter the SMTP password' };
  return {
    ok: true,
    smtp: { host: d.host, port: d.port, security: d.security, username: d.username, password, fromName: d.fromName, fromEmail: d.fromEmail },
  };
}

async function verify(smtp: SmtpConfig): Promise<ActionResult> {
  try {
    await createSmtpTransport(smtp).verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: smtpError(err) };
  }
}

export async function testEmailConnection(input: EmailConfigInput): Promise<ActionResult> {
  await requireAdmin();
  const r = await resolve(input);
  return r.ok ? verify(r.smtp) : r;
}

export async function sendTestEmail(input: EmailConfigInput, to: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const recipient = z.email('Enter a valid address to send the test to').safeParse(to.trim() || session.email);
  if (!recipient.success) return { ok: false, error: recipient.error.issues[0]?.message ?? 'Invalid address' };
  const r = await resolve(input);
  if (!r.ok) return r;
  const settings = await getRawSettings();
  try {
    await deliver(r.smtp, settings, {
      to: recipient.data,
      subject: `Test email from ${settings.general.siteName}`,
      text: `This is a test email from your website's admin panel.\n\nIf you can read this, outgoing email is working: Founding Member welcome emails, tour confirmations and owner alerts will be delivered.\n\nSent through ${r.smtp.host}:${r.smtp.port} as ${r.smtp.fromEmail}.`,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: smtpError(err) };
  }
}

export async function saveEmailConfig(input: EmailConfigInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' };
  const d = parsed.data;

  let passwordEncrypted = (await stored()).passwordEncrypted;
  if (d.enabled) {
    // Refuse to switch on settings that would make every email fail.
    const r = await resolve(input);
    if (!r.ok) return r;
    const check = await verify(r.smtp);
    if (!check.ok) return check;
    passwordEncrypted = r.smtp.password ? encryptSmtpPassword(r.smtp.password) : '';
  } else if (d.password) {
    passwordEncrypted = encryptSmtpPassword(d.password);
  }

  const data = {
    enabled: d.enabled,
    host: d.host,
    port: d.port,
    security: d.security,
    username: d.username,
    passwordEncrypted,
    fromName: d.fromName,
    fromEmail: d.fromEmail,
  };
  const existing = await db.orm.settings.where({ key: EMAIL_SETTINGS_KEY }).first();
  if (existing) await db.orm.settings.where({ key: EMAIL_SETTINGS_KEY }).update({ data });
  else await db.orm.settings.create({ key: EMAIL_SETTINGS_KEY, data });
  revalidatePath('/admin', 'layout');
  return { ok: true };
}
