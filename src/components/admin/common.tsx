'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/app/admin/actions';

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Runs a server action with a pending state and toast feedback. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  function run(fn: () => Promise<ActionResult>, success?: string, after?: (r: ActionResult) => void) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          if (success) toast.success(success);
        } else toast.error(result.error);
        after?.(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }
  return { pending, run };
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  destructive = true,
  onConfirm,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy && <Loader2 className="animate-spin" />} {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function StatusDot({ tone }: { tone: 'green' | 'amber' | 'gray' | 'blue' | 'red' }) {
  const colors = { green: 'bg-emerald-500', amber: 'bg-amber-500', gray: 'bg-zinc-400', blue: 'bg-sky-500', red: 'bg-red-500' };
  return <span className={`inline-block size-2 rounded-full ${colors[tone]}`} />;
}
