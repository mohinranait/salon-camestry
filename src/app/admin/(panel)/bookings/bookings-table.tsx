'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { formatDate, formatTime, studioNow } from '@/lib/booking';
import type { BookingDoc, BookingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { deleteBooking, updateBooking } from '@/app/admin/actions';

const STATUSES: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EMAIL_LABEL: Record<string, string> = { sent: 'sent', skipped: 'not sent (email not set up)', failed: 'failed to send', disabled: 'turned off', pending: 'sending…' };

export function BookingsTable({ bookings }: { bookings: BookingDoc[] }) {
  const router = useRouter();
  const { run } = useAction();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const today = studioNow().date;
  const list = bookings.filter((b) => (view === 'upcoming' ? b.date >= today : b.date < today));
  if (view === 'past') list.reverse();

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border bg-background p-0.5 sm:w-fit">
        {(['upcoming', 'past'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} className={cn('flex-1 rounded-md px-4 py-1.5 text-sm capitalize', view === v ? 'bg-foreground text-background' : 'text-muted-foreground')}>
            {v}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead className="hidden md:table-cell">Specialty</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No {view} tours.</TableCell>
              </TableRow>
            )}
            {list.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium">{formatDate(b.date)}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(b.time)}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a> · <a href={`tel:${b.phone}`} className="hover:underline">{b.phone}</a>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Last email: {EMAIL_LABEL[b.emailStatus] ?? b.emailStatus}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{b.specialty || '—'}</TableCell>
                <TableCell className="hidden max-w-60 truncate text-xs lg:table-cell">{b.notes || '—'}</TableCell>
                <TableCell>
                  <Select items={STATUSES} value={b.status} onValueChange={(v) => run(() => updateBooking(b.id, v as BookingStatus), undefined, (r) => {
                    if (r.ok) toast.success(r.id === 'notified' ? 'Booking updated · guest emailed' : 'Booking updated');
                    router.refresh();
                  })}>
                    <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <ConfirmDialog
                    title="Delete this booking?"
                    description="The time slot becomes available again."
                    onConfirm={() => run(() => deleteBooking(b.id), 'Booking deleted', () => router.refresh())}
                    trigger={(o) => <Button size="icon-sm" variant="ghost" onClick={o} aria-label="Delete"><Trash2 /></Button>}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
