'use client';

import { useRouter } from 'next/navigation';
import { Rocket, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { setPhase } from '@/app/admin/actions';

export function PhaseSwitch({ phase }: { phase: 'phase1' | 'phase2' }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const live = phase === 'phase2';

  return (
    <section className="overflow-hidden rounded-xl border bg-black text-white">
      <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.3em] text-[#c6a15b] uppercase">{live ? 'Phase 2 · Live' : 'Phase 1 · Pre-launch'}</p>
          <h2 className="font-display text-3xl">{live ? 'Leasing & tours are live' : 'Collecting Founding Member leads'}</h2>
          <p className="max-w-2xl text-sm text-white/65">
            {live
              ? 'The member directory and private tour booking are public, and every primary button says “Book a Tour”.'
              : 'The site promotes the VIP waitlist. The member directory and tour booking are built and waiting. One click makes them public.'}
          </p>
        </div>
        <ConfirmDialog
          title={live ? 'Return to Phase 1?' : 'Launch Phase 2?'}
          description={
            live
              ? 'The directory and tour booking pages will be hidden again and buttons return to “Join VIP Waitlist”.'
              : 'This unhides “Find a Beauty Pro” and “Book a Tour”, switches every primary button to tour booking and opens the booking calendar.'
          }
          confirmLabel={live ? 'Return to Phase 1' : 'Go live'}
          destructive={false}
          onConfirm={() => run(() => setPhase(live ? 'phase1' : 'phase2'), live ? 'Back to Phase 1' : 'Phase 2 is live', () => router.refresh())}
          trigger={(open) => (
            <Button
              onClick={open}
              disabled={pending}
              size="lg"
              className={live ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#c6a15b] text-black hover:bg-[#d8b56f]'}
            >
              {live ? <Undo2 /> : <Rocket />} {live ? 'Back to Phase 1' : 'Switch to Phase 2'}
            </Button>
          )}
        />
      </div>
    </section>
  );
}
