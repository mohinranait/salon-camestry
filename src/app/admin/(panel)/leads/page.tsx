import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { toLeadDoc } from '@/lib/server/data';
import { getSmtpConfig } from '@/lib/server/email';
import Link from 'next/link';
import { LeadsTable } from './leads-table';

export default async function LeadsPage() {
  const [rows, smtp] = await Promise.all([db.orm.leads.orderBy({ createdAt: -1 }).all(), getSmtpConfig()]);
  const leads = rows.map(toLeadDoc);
  return (
    <>
      <PageHeading
        title="VIP waitlist leads"
        description="Founding Member inquiries from the website. Each new inquiry gets the automatic welcome email."
      />
      {!smtp && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Welcome emails are not being sent yet. <Link href="/admin/email" className="font-medium underline">Set up email</Link> to send them automatically.
        </p>
      )}
      <LeadsTable leads={leads} />
    </>
  );
}
