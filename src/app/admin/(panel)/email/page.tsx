import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { requireAdmin } from '@/lib/server/auth';
import { getRawSettings } from '@/lib/server/data';
import { decryptSmtpPassword, EMAIL_SETTINGS_KEY, parseStoredEmailConfig, smtpFromEnv } from '@/lib/email-config';
import { EmailForm } from './email-form';

export default async function EmailPage() {
  const [session, row, settings] = await Promise.all([
    requireAdmin(),
    db.orm.settings.where({ key: EMAIL_SETTINGS_KEY }).first(),
    getRawSettings(),
  ]);
  const config = parseStoredEmailConfig(row?.data);
  const hasPassword = Boolean(config.passwordEncrypted);
  // A password saved under a different AUTH_SECRET can no longer be read.
  const passwordUnreadable = hasPassword && decryptSmtpPassword(config.passwordEncrypted) === null;

  return (
    <>
      <PageHeading
        title="Email"
        description="The mail server your website sends from: Founding Member welcome emails, tour confirmations and your new-lead alerts."
      />
      <EmailForm
        initial={{
          enabled: config.enabled,
          host: config.host,
          port: config.port,
          security: config.security,
          username: config.username,
          password: '',
          fromName: config.fromName || settings.emails.fromName,
          fromEmail: config.fromEmail || settings.emails.fromEmail,
        }}
        hasPassword={hasPassword && !passwordUnreadable}
        passwordUnreadable={passwordUnreadable}
        envFallback={Boolean(smtpFromEnv())}
        testRecipient={settings.emails.notifyEmail || session.email}
      />
    </>
  );
}
