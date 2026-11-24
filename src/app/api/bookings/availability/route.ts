import { NextResponse } from 'next/server';
import { getRawSettings } from '@/lib/server/data';
import { availableSlots } from '@/lib/server/bookings';
import { addDays, studioNow } from '@/lib/booking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  const settings = await getRawSettings();
  const today = studioNow().date;
  const window = { min: today, max: addDays(today, settings.booking.maxDaysAhead) };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ slots: [], window, closedWeekdays: closedWeekdays(settings), blackoutDates: settings.booking.blackoutDates });
  }
  return NextResponse.json({ slots: await availableSlots(settings, date), window });
}

function closedWeekdays(settings: Awaited<ReturnType<typeof getRawSettings>>) {
  return settings.booking.weekly.filter((w) => w.times.length === 0).map((w) => w.day);
}
