// SMTP settings for outgoing email, managed in Admin → Email and sent with
// Nodemailer. No `server-only` import so scripts can use it; never import it
// from client components.
import nodemailer, { type Transporter } from 'nodemailer';
import { decryptSecret, encryptSecret } from './secrets';

export const EMAIL_SETTINGS_KEY = 'email';
const PURPOSE = 'smtp';

import type { SmtpSecurity } from './email-presets';

export type { SmtpSecurity };
export { SMTP_PRESETS } from './email-presets';

/** As stored in the `settings` collection. The password is encrypted with AUTH_SECRET. */
export type StoredEmailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  passwordEncrypted: string;
  fromName: string;
  fromEmail: string;
};

export type SmtpConfig = Omit<StoredEmailConfig, 'passwordEncrypted' | 'enabled'> & { password: string };

export function parseStoredEmailConfig(data: unknown): StoredEmailConfig {
  const d = (data && typeof data === 'object' ? data : {}) as Partial<StoredEmailConfig>;
  const security: SmtpSecurity = d.security === 'ssl' || d.security === 'none' ? d.security : 'starttls';
  return {
    enabled: Boolean(d.enabled),
    host: String(d.host ?? ''),
    port: Number(d.port) || (security === 'ssl' ? 465 : 587),
    security,
    username: String(d.username ?? ''),
    passwordEncrypted: String(d.passwordEncrypted ?? ''),
    fromName: String(d.fromName ?? ''),
    fromEmail: String(d.fromEmail ?? ''),
  };
}

export const encryptSmtpPassword = (plain: string) => encryptSecret(plain, PURPOSE);
export const decryptSmtpPassword = (stored: string) => decryptSecret(stored, PURPOSE);

/** A usable SMTP config, or null when email is off or incomplete. */
export function toSmtpConfig(stored: StoredEmailConfig): SmtpConfig | null {
  if (!stored.enabled || !stored.host || !stored.fromEmail) return null;
  const password = stored.passwordEncrypted ? decryptSmtpPassword(stored.passwordEncrypted) : '';
  if (password === null) return null;
  return { host: stored.host, port: stored.port, security: stored.security, username: stored.username, password, fromName: stored.fromName, fromEmail: stored.fromEmail };
}

/** SMTP from the SMTP_* environment variables, used when nothing is saved in the admin panel. */
export function smtpFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const secure = process.env.SMTP_SECURE === 'true';
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? (secure ? 465 : 587)),
    security: secure ? 'ssl' : 'starttls',
    username: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASS ?? '',
    fromName: '',
    fromEmail: process.env.SMTP_FROM ?? '',
  };
}

export function createSmtpTransport(c: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.security === 'ssl',
    requireTLS: c.security === 'starttls',
    ignoreTLS: c.security === 'none',
    auth: c.username ? { user: c.username, pass: c.password } : undefined,
    // Fail fast instead of Nodemailer's two-minute defaults.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

/** Explains common SMTP failures in plain words. */
export function smtpError(error: unknown) {
  const e = error as { code?: string; responseCode?: number; message?: string } | undefined;
  const message = e?.message ?? 'Could not reach the email server';
  if (e?.code === 'EAUTH' || e?.responseCode === 535 || e?.responseCode === 534) {
    return 'The email server rejected the username or password. Gmail and Outlook need an app password.';
  }
  if (e?.code === 'ESOCKET' && /wrong version number|ssl3_get_record|tls/i.test(message)) {
    return 'Security setting does not match the port. Use SSL with port 465, or STARTTLS with port 587.';
  }
  if (e?.code === 'ECONNECTION' || e?.code === 'ETIMEDOUT' || e?.code === 'ESOCKET' || e?.code === 'EDNS') {
    return `Could not connect to ${message.includes('getaddrinfo') ? 'that server name' : 'the email server'}. Check the server and port.`;
  }
  if (e?.responseCode === 550 || e?.responseCode === 553 || e?.responseCode === 554) {
    return `The email server refused the message: ${message}. The From email usually has to be the account you sign in with, or a verified sender.`;
  }
  return message;
}
