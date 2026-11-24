import 'server-only';
import nodemailer from 'nodemailer';
import type { SiteSettings } from '@/lib/settings';

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function htmlBody(text: string, settings: SiteSettings) {
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  const { gold, black, ivory } = settings.brand;
  return `<!doctype html><html><body style="margin:0;background:${ivory};font-family:Georgia,serif;color:#222">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
<tr><td style="background:${black};padding:28px 32px;color:${gold};font-size:20px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(settings.general.siteName)}</td></tr>
<tr><td style="height:3px;background:${gold}"></td></tr>
<tr><td style="padding:32px;font-size:16px">${paragraphs}</td></tr>
<tr><td style="padding:20px 32px;background:${black};color:#bbb;font-size:12px;font-family:Arial,sans-serif">${escapeHtml(
    `${settings.general.street}, ${settings.general.suite}, ${settings.general.city}, ${settings.general.state} ${settings.general.zip}`,
  )}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Sends an email; returns a status string stored on the lead or booking. */
export async function sendEmail(
  settings: SiteSettings,
  message: { to: string; subject: string; text: string; replyTo?: string },
): Promise<'sent' | 'skipped' | 'failed'> {
  const t = transport();
  if (!t) {
    console.info(`[email] SMTP not configured; skipped "${message.subject}" to ${message.to}`);
    return 'skipped';
  }
  try {
    await t.sendMail({
      from: `"${settings.emails.fromName}" <${process.env.SMTP_FROM ?? settings.emails.fromEmail}>`,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: htmlBody(message.text, settings),
    });
    return 'sent';
  } catch (err) {
    console.error('[email] send failed', err);
    return 'failed';
  }
}
