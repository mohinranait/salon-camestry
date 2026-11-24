import Link from 'next/link';
import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { getRawSettings, toBookingDoc } from '@/lib/server/data';
import { BookingsTable } from './bookings-table';

export default async function BookingsPage() {
  const [rows, settings] = await Promise.all([db.orm.bookings.orderBy({ date: 1 }).all(), getRawSettings()]);
  const bookings = rows.map(toBookingDoc).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <>
      <PageHeading
        title="Private tour bookings"
        description="Tour requests from the Book a Tour page. Set available days and times in Settings → Tour booking."
      />
      {settings.phase.current !== 'phase2' && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tour booking is pre-installed but hidden. It opens to the public when you switch the site to Phase 2 from the <Link className="underline" href="/admin">dashboard</Link>.
        </p>
      )}
      <BookingsTable bookings={bookings} />
    </>
  );
}
