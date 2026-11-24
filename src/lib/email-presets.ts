// Client-safe email settings shared by the admin form and the server.

export type SmtpSecurity = 'ssl' | 'starttls' | 'none';

/** Common providers, so the owner only has to type their login. */
export const SMTP_PRESETS: { id: string; label: string; host: string; port: number; security: SmtpSecurity; note: string }[] = [
  { id: 'gmail', label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 465, security: 'ssl', note: 'Use a Google “App password”, not your normal password (Google Account → Security → 2-Step Verification → App passwords).' },
  { id: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, security: 'starttls', note: 'Your Microsoft 365 admin may need to enable “Authenticated SMTP” for the mailbox.' },
  { id: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: 465, security: 'ssl', note: 'Use a Zoho app-specific password if two-factor sign-in is on.' },
  { id: 'brevo', label: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, security: 'starttls', note: 'Username is your Brevo login; password is an SMTP key from SMTP & API settings.' },
  { id: 'sendgrid', label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, security: 'starttls', note: 'Username is literally “apikey”; password is your SendGrid API key.' },
  { id: 'mailgun', label: 'Mailgun', host: 'smtp.mailgun.org', port: 587, security: 'starttls', note: 'Use the SMTP credentials of your Mailgun sending domain.' },
  { id: 'custom', label: 'Other provider', host: '', port: 587, security: 'starttls', note: 'Enter the SMTP server your email host gives you.' },
];
