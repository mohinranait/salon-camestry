import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { toLeadDoc } from '@/lib/server/data';
import { LeadsTable } from './leads-table';

export default async function LeadsPage() {
  const leads = (await db.orm.leads.orderBy({ createdAt: -1 }).all()).map(toLeadDoc);
  return (
    <>
      <PageHeading
        title="VIP waitlist leads"
        description="Founding Member inquiries from the website. Each one received the automated welcome email."
      />
      <LeadsTable leads={leads} />
    </>
  );
}
