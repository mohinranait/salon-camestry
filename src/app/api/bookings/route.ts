import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { getRawSettings } from '@/lib/server/data';
import { availableSlots } from '@/lib/server/bookings';
import { renderTemplate, sendEmail } from '@/lib/server/email';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';
import { formatDate, formatTime } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.email('Please enter a valid email').max(200),
  phone: z.string().trim().min(7, 'Please enter a valid phone number').max(30),
  specialty: z.string().trim().max(80).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time'),
  notes: z.string().trim().max(2000).optional().default(''),
  company: z.string().optional(), // honeypot
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid form' }, { status: 400 });
  }
  const data = parsed.data;
  if (data.company) return NextResponse.json({ ok: true });

  const settings = await getRawSettings();
  if (settings.phase.current !== 'phase2') {
    return NextResponse.json({ error: 'Private tours open in Spring 2027. Join the VIP waitlist to be first in line.' }, { status: 403 });
  }
  if (!rateLimit(`booking:${clientKey(request)}`)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  const slots = await availableSlots(settings, data.date);
  if (!slots.includes(data.time)) {
    return NextResponse.json({ error: 'That time was just taken. Please choose another slot.' }, { status: 409 });
  }

  const booking = await db.orm.bookings.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    specialty: data.specialty,
    date: data.date,
    time: data.time,
    notes: data.notes,
    status: 'pending',
    emailStatus: 'pending',
  });

  const vars = {
    name: data.name,
    firstName: data.name.split(/\s+/)[0],
    date: formatDate(data.date),
    time: formatTime(data.time),
  };
  let emailStatus: string = 'disabled';
  const tpl = settings.emails.tourConfirmation;
  if (tpl.enabled) {
    emailStatus = await sendEmail(settings, {
      to: data.email,
      subject: renderTemplate(tpl.subject, vars),
      text: renderTemplate(tpl.body, vars),
      replyTo: settings.emails.notifyEmail || undefined,
    });
  }
  await db.orm.bookings.where({ id: booking.id }).update({ emailStatus });

  if (settings.emails.bookingAlert.enabled && settings.emails.notifyEmail) {
    await sendEmail(settings, {
      to: settings.emails.notifyEmail,
      subject: `New tour request: ${data.name} on ${vars.date} at ${vars.time}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nSpecialty: ${data.specialty || '—'}\nWhen: ${vars.date} at ${vars.time}\nNotes: ${data.notes || '—'}`,
      replyTo: data.email,
    });
  }

  return NextResponse.json({ ok: true });
}
