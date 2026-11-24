import { db } from '@/prisma/db';
import { getSession } from '@/lib/server/auth';
import { toLeadDoc } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

function csvCell(value: string) {
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await getSession())) return new Response('Unauthorized', { status: 401 });
  const rows = (await db.orm.leads.orderBy({ createdAt: -1 }).all()).map(toLeadDoc);
  const header = ['Date', 'Name', 'Email', 'Phone', 'Specialty', 'Suite size', 'Wet/Dry', 'Target move-in', 'Status', 'Message', 'Notes', 'Welcome email'];
  const lines = rows.map((l) =>
    [l.createdAt.slice(0, 10), l.name, l.email, l.phone, l.specialty, l.suiteSize, l.suiteType, l.moveIn, l.status, l.message, l.notes, l.emailStatus]
      .map(csvCell)
      .join(','),
  );
  const csv = [header.map(csvCell).join(','), ...lines].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="founding-member-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
