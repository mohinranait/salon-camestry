'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Download, Loader2, Mail, Phone, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import type { LeadDoc, LeadStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { deleteLead, updateLead } from '@/app/admin/actions';

const STATUSES: { value: LeadStatus; label: string; className: string }[] = [
  { value: 'new', label: 'New', className: 'bg-amber-100 text-amber-900' },
  { value: 'contacted', label: 'Contacted', className: 'bg-sky-100 text-sky-900' },
  { value: 'toured', label: 'Toured', className: 'bg-violet-100 text-violet-900' },
  { value: 'signed', label: 'Signed', className: 'bg-emerald-100 text-emerald-900' },
  { value: 'archived', label: 'Archived', className: 'bg-zinc-100 text-zinc-600' },
];
const statusMeta = (s: string) => STATUSES.find((x) => x.value === s) ?? STATUSES[0];

const EMAIL_LABEL: Record<string, string> = { sent: 'Welcome sent', skipped: 'Not sent (email not set up)', failed: 'Email failed', disabled: 'Welcome off', pending: 'Sending…' };

export function LeadsTable({ leads }: { leads: LeadDoc[] }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [active, setActive] = useState<LeadDoc | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return leads.filter(
      (l) =>
        (status === 'all' || l.status === status) &&
        (!needle || [l.name, l.email, l.phone, l.specialty].some((v) => v.toLowerCase().includes(needle))),
    );
  }, [leads, q, status]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.value, leads.filter((l) => l.status === s.value).length])), [leads]);

  function open(lead: LeadDoc) {
    setActive(lead);
    setNotes(lead.notes);
  }

  function setLeadStatus(lead: LeadDoc, value: LeadStatus) {
    run(() => updateLead(lead.id, { status: value }), 'Status updated', () => router.refresh());
    if (active?.id === lead.id) setActive({ ...lead, status: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(status === s.value ? 'all' : s.value)}
            className={cn('rounded-xl border bg-background p-3 text-left transition', status === s.value && 'ring-2 ring-amber-400')}
          >
            <p className="text-2xl font-semibold">{counts[s.value]}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, specialty" className="bg-background pl-8" />
        </div>
        {/* A file download from an API route, not a page navigation. */}
        <Button nativeButton={false} variant="outline" className="ml-auto" render={<a href="/api/admin/leads/export" download />}>
          <Download /> Export CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Specialty</TableHead>
              <TableHead className="hidden lg:table-cell">Suite preference</TableHead>
              <TableHead className="hidden lg:table-cell">Move-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No leads match.</TableCell>
              </TableRow>
            )}
            {filtered.map((l) => (
              <TableRow key={l.id} className="cursor-pointer" onClick={() => open(l)}>
                <TableCell>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.email}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{l.specialty}</TableCell>
                <TableCell className="hidden lg:table-cell">{l.suiteSize} · {l.suiteType}</TableCell>
                <TableCell className="hidden lg:table-cell">{l.moveIn}</TableCell>
                <TableCell>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusMeta(l.status).className)}>{statusMeta(l.status).label}</span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.name}</SheetTitle>
                <SheetDescription>Received {new Date(active.createdAt).toLocaleString()}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <div className="flex gap-2">
                  <Button nativeButton={false} variant="outline" size="sm" render={<a href={`mailto:${active.email}`} />}><Mail /> Email</Button>
                  <Button nativeButton={false} variant="outline" size="sm" render={<a href={`tel:${active.phone}`} />}><Phone /> Call</Button>
                </div>
                <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Email</dt><dd className="break-all">{active.email}</dd>
                  <dt className="text-muted-foreground">Phone</dt><dd>{active.phone}</dd>
                  <dt className="text-muted-foreground">Specialty</dt><dd>{active.specialty}</dd>
                  <dt className="text-muted-foreground">Suite size</dt><dd>{active.suiteSize}</dd>
                  <dt className="text-muted-foreground">Wet / dry</dt><dd>{active.suiteType}</dd>
                  <dt className="text-muted-foreground">Move-in</dt><dd>{active.moveIn}</dd>
                  <dt className="text-muted-foreground">Welcome email</dt><dd><Badge variant="secondary">{EMAIL_LABEL[active.emailStatus] ?? active.emailStatus}</Badge></dd>
                </dl>
                {active.message && (
                  <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{active.message}</div>
                )}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select items={STATUSES} value={active.status} onValueChange={(v) => setLeadStatus(active, v as LeadStatus)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-notes">Private notes</Label>
                  <Textarea id="lead-notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <Button size="sm" disabled={pending || notes === active.notes} onClick={() => run(() => updateLead(active.id, { notes }), 'Notes saved', () => { setActive({ ...active, notes }); router.refresh(); })}>
                    {pending && <Loader2 className="animate-spin" />} Save notes
                  </Button>
                </div>
                <ConfirmDialog
                  title="Delete this lead?"
                  description="The inquiry is permanently removed."
                  onConfirm={() => run(() => deleteLead(active.id), 'Lead deleted', () => { setActive(null); router.refresh(); })}
                  trigger={(o) => <Button variant="destructive" size="sm" onClick={o}><Trash2 /> Delete lead</Button>}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
