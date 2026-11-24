import 'server-only';
import { db } from '@/prisma/db';
import {
  createSmtpTransport, EMAIL_SETTINGS_KEY, parseStoredEmailConfig, smtpError, smtpFromEnv, toSmtpConfig, type SmtpConfig,
} from '@/lib/email-config';
import type { SiteSettings } from '@/lib/settings';

export type EmailStatus = 'sent' | 'skipped' | 'failed';

/** Absolute link into the admin panel for owner alerts. */
export function adminUrl(path: string) {
  return `${(process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')}${path}`;
}

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

/** SMTP saved in Admin → Email, else the SMTP_* environment variables, else null. */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const row = await db.orm.settings.where({ key: EMAIL_SETTINGS_KEY }).first();
  return toSmtpConfig(parseStoredEmailConfig(row?.data)) ?? smtpFromEnv();
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Turns plain text into simple HTML; bare URLs become links. */
function paragraphsHtml(text: string) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#8a6a2f">$1</a>'))
    .map((p) => `<p style="margin:0 0 16px;line-height:1.65">${p}</p>`)
    .join('');
}

export function emailHtml(text: string, settings: SiteSettings) {
  const { gold, black, ivory } = settings.brand;
  const g = settings.general;
  const site = process.env.SITE_URL ?? '';
  return `<!doctype html><html><body style="margin:0;background:${ivory};font-family:Georgia,'Times New Roman',serif;color:#222">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff">
<tr><td style="background:${black};padding:28px 32px">
  <div style="color:#faf7f1;font-size:26px;line-height:1">Shear <em style="color:${gold}">Chemistry</em></div>
  <div style="color:#bbbbbb;font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;margin-top:6px">SALON SUITES</div>
</td></tr>
<tr><td style="height:3px;background:${gold}"></td></tr>
<tr><td style="padding:32px;font-size:16px">${paragraphsHtml(text)}</td></tr>
<tr><td style="padding:20px 32px;background:${black};color:#bbbbbb;font-size:12px;font-family:Arial,sans-serif;line-height:1.6">
  ${escapeHtml(`${g.street}, ${g.suite}, ${g.city}, ${g.state} ${g.zip}`)}<br>
  ${[g.phone, g.email].filter(Boolean).map(escapeHtml).join(' · ')}
  ${site ? `<br><a href="${escapeHtml(site)}" style="color:${gold}">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>` : ''}
</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Sends an email and returns a status to store on the lead or booking.
 * Never throws: a failed email must not fail the form that triggered it.
 */
export async function sendEmail(
  settings: SiteSettings,
  message: { to: string; subject: string; text: string; replyTo?: string },
): Promise<EmailStatus> {
  try {
    const smtp = await getSmtpConfig();
    if (!smtp) {
      console.info(`[email] Not configured; skipped "${message.subject}" to ${message.to}`);
      return 'skipped';
    }
    await deliver(smtp, settings, message);
    return 'sent';
  } catch (err) {
    console.error('[email] send failed:', smtpError(err));
    return 'failed';
  }
}

/** Sends with a specific SMTP config and throws on failure (used by “Send test email”). */
export async function deliver(
  smtp: SmtpConfig,
  settings: SiteSettings,
  message: { to: string; subject: string; text: string; replyTo?: string },
) {
  const fromName = smtp.fromName || settings.emails.fromName || settings.general.siteName;
  const fromEmail = smtp.fromEmail || settings.emails.fromEmail;
  await createSmtpTransport(smtp).sendMail({
    from: { name: fromName, address: fromEmail },
    to: message.to,
    replyTo: message.replyTo || undefined,
    subject: message.subject,
    text: message.text,
    html: emailHtml(message.text, settings),
  });
}
