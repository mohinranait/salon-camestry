import 'server-only';
import { db } from '@/prisma/db';
import { slotsForDate } from '@/lib/booking';
import type { SiteSettings } from '@/lib/settings';

export async function availableSlots(settings: SiteSettings, date: string) {
  const offered = slotsForDate(settings.booking, date);
  if (offered.length === 0) return [];
  const booked = await db.orm.bookings.where({ date }).select('time', 'status').all();
  const taken = new Set(booked.filter((b) => b.status !== 'cancelled').map((b) => b.time));
  return offered.filter((t) => !taken.has(t));
}
