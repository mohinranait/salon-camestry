import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { getRawSettings } from '@/lib/server/data';
import { adminUrl, renderTemplate, sendEmail } from '@/lib/server/email';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  phone: z.string().trim().min(7, 'Please enter a valid phone number').max(30),
  email: z.email('Please enter a valid email').max(200),
  specialty: z.string().trim().min(1, 'Choose your specialty').max(80),
  suiteSize: z.string().trim().min(1, 'Choose a suite size').max(60),
  suiteType: z.string().trim().min(1, 'Choose wet or dry').max(60),
  moveIn: z.string().trim().min(1, 'Choose a target move-in').max(60),
  message: z.string().trim().max(2000).optional().default(''),
  company: z.string().optional(), // honeypot
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid form' }, { status: 400 });
  }
  const data = parsed.data;
  // Bots fill the hidden field; pretend success so they move on.
  if (data.company) return NextResponse.json({ ok: true });
  if (!rateLimit(`lead:${clientKey(request)}`)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
  }

  const settings = await getRawSettings();
  const lead = await db.orm.leads.create({
    name: data.name,
    phone: data.phone,
    email: data.email.toLowerCase(),
    specialty: data.specialty,
    suiteSize: data.suiteSize,
    suiteType: data.suiteType,
    moveIn: data.moveIn,
    message: data.message,
    status: 'new',
    notes: '',
    emailStatus: 'pending',
  });

  const vars = {
    name: data.name,
    firstName: data.name.split(/\s+/)[0],
    email: data.email,
    phone: data.phone,
    specialty: data.specialty,
    suiteSize: data.suiteSize,
    suiteType: data.suiteType,
    suitePreference: `${data.suiteSize} · ${data.suiteType}`,
    moveIn: data.moveIn,
  };

  // Emails go out after the response, so a slow mail server never delays the visitor.
  after(async () => {
    let emailStatus: string = 'disabled';
    const welcome = settings.emails.waitlistWelcome;
    if (welcome.enabled) {
      emailStatus = await sendEmail(settings, {
        to: data.email,
        subject: renderTemplate(welcome.subject, vars),
        text: renderTemplate(welcome.body, vars),
        replyTo: settings.emails.notifyEmail || undefined,
      });
    }
    await db.orm.leads.where({ id: lead.id }).update({ emailStatus });

    if (settings.emails.leadAlert.enabled && settings.emails.notifyEmail) {
      await sendEmail(settings, {
        to: settings.emails.notifyEmail,
        subject: `New Founding Member lead: ${data.name}`,
        text: `A new VIP waitlist inquiry arrived.

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Specialty / license: ${data.specialty}
Suite: ${data.suiteSize} · ${data.suiteType}
Target move-in: ${data.moveIn}
Message: ${data.message || '—'}

View all leads: ${adminUrl('/admin/leads')}`,
        replyTo: data.email,
      });
    }
  });

  return NextResponse.json({ ok: true });
}
