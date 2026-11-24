import type { Metadata } from 'next';
import { db } from '@/prisma/db';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { requireAdmin } from '@/lib/server/auth';
import { getRawSettings } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Shear Chemistry',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [newLeads, pendingBookings, settings] = await Promise.all([
    db.orm.leads.where({ status: 'new' }).select('id').all(),
    db.orm.bookings.where({ status: 'pending' }).select('id').all(),
    getRawSettings(),
  ]);

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{ name: session.name, email: session.email }}
        counts={{ leads: newLeads.length, bookings: pendingBookings.length }}
        phase={settings.phase.current}
      />
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">Welcome back, {session.name.split(' ')[0]}</span>
        </header>
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
