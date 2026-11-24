import Link from 'next/link';
import { ArrowRight, CalendarCheck, HardHat, ImageIcon, Users } from 'lucide-react';
import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { buildProgress, getMilestones, getRawSettings, toLeadDoc } from '@/lib/server/data';
import { formatDate, formatTime, studioNow } from '@/lib/booking';
import { PhaseSwitch } from './phase-switch';

/** Start of the rolling window used for "this week" counts. */
function daysAgo(days: number) {
  return Date.now() - days * 86_400_000;
}

export default async function Dashboard() {
  const [settings, leadRows, bookingRows, mediaRows, milestones] = await Promise.all([
    getRawSettings(),
    db.orm.leads.orderBy({ createdAt: -1 }).all(),
    db.orm.bookings.orderBy({ date: 1 }).all(),
    db.orm.media.select('id').all(),
    getMilestones(),
  ]);
  const leads = leadRows.map(toLeadDoc);
  const weekAgo = daysAgo(7);
  const today = studioNow().date;
  const upcoming = bookingRows.filter((b) => b.date >= today && b.status !== 'cancelled');
  const progress = buildProgress(milestones);
  const current = milestones.find((m) => m.status === 'in-progress') ?? milestones.find((m) => m.status === 'upcoming');

  const stats = [
    { label: 'Waitlist leads', value: leads.length, sub: `${leads.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length} this week`, icon: Users, href: '/admin/leads' },
    { label: 'Upcoming tours', value: upcoming.length, sub: settings.phase.current === 'phase2' ? 'Booking is live' : 'Opens in Phase 2', icon: CalendarCheck, href: '/admin/bookings' },
    { label: 'Build progress', value: `${progress}%`, sub: current ? `Now: ${current.title}` : 'All milestones complete', icon: HardHat, href: '/admin/milestones' },
    { label: 'Media files', value: mediaRows.length, sub: 'In the library', icon: ImageIcon, href: '/admin/media' },
  ];

  return (
    <>
      <PageHeading title="Dashboard" description={`${settings.general.siteName} · opening ${settings.phase.openingLabel}`} />

      <PhaseSwitch phase={settings.phase.current} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl border bg-background p-4 transition hover:shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm">{s.label}</span>
              <s.icon className="size-4" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Latest leads</h2>
            <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">All leads <ArrowRight className="size-3" /></Link>
          </div>
          <ul className="divide-y">
            {leads.slice(0, 6).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.specialty} · {l.suiteSize} · {l.suiteType}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {leads.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No leads yet.</li>}
          </ul>
        </section>

        <section className="rounded-xl border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Build-out tracker</h2>
            <Link href="/admin/milestones" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Post an update <ArrowRight className="size-3" /></Link>
          </div>
          <div className="p-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-[#a8853f] to-[#e4cc94]" style={{ width: `${progress}%` }} />
            </div>
            <ol className="mt-4 space-y-2.5">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span className={`size-2.5 shrink-0 rounded-full ${m.status === 'completed' ? 'bg-emerald-500' : m.status === 'in-progress' ? 'bg-amber-500' : 'bg-zinc-300'}`} />
                  <span className="flex-1">{m.title}</span>
                  <span className="text-xs text-muted-foreground">{m.dateLabel}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className="rounded-xl border bg-background lg:col-span-2">
            <div className="border-b px-4 py-3"><h2 className="font-semibold">Next tours</h2></div>
            <ul className="divide-y">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground">{formatDate(b.date)} · {formatTime(b.time)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
