import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { requireAdmin } from '@/lib/server/auth';
import { UsersManager } from './users-manager';

export default async function UsersPage() {
  const session = await requireAdmin();
  const users = await db.orm.admin_users.orderBy({ createdAt: 1 }).select('id', 'name', 'email', 'lastLoginAt', 'createdAt').all();
  return (
    <>
      <PageHeading title="Admin users" description="People who can sign in to this admin panel." />
      <UsersManager
        currentId={session.sub}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
        }))}
      />
    </>
  );
}
