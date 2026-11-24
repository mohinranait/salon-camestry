import type { SiteSettings } from './settings';

// Tour slots are expressed in the studio's local time (Atlanta).
export const STUDIO_TIMEZONE = 'America/New_York';

/** Today's date (YYYY-MM-DD) and minutes since midnight in the studio's timezone. */
export function studioNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatTime(time: string) {
  const mins = toMinutes(time);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Slots offered on a date before removing the ones already booked. */
export function slotsForDate(booking: SiteSettings['booking'], date: string, now = new Date()) {
  const today = studioNow(now);
  if (date < today.date || date > addDays(today.date, booking.maxDaysAhead)) return [];
  if (booking.blackoutDates.includes(date)) return [];
  const times = booking.weekly.find((w) => w.day === weekday(date))?.times ?? [];
  const daysAhead = Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today.date}T12:00:00Z`).getTime()) / 86_400_000,
  );
  const noticeMinutes = booking.minNoticeHours * 60;
  return [...times]
    .sort()
    .filter((t) => daysAhead * 24 * 60 + toMinutes(t) - today.minutes >= noticeMinutes);
}
