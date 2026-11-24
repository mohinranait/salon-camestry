'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { changePassword, createAdminUser, deleteAdminUser } from '@/app/admin/actions';

type User = { id: string; name: string; email: string; lastLoginAt: string | null };

export function UsersManager({ users, currentId }: { users: User[]; currentId: string }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [pw, setPw] = useState({ current: '', next: '' });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="divide-y overflow-hidden rounded-xl border bg-background">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-[#c6a15b]">
              {u.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {u.name} {u.id === currentId && <Badge variant="secondary">You</Badge>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {u.email} · {u.lastLoginAt ? `last sign-in ${new Date(u.lastLoginAt).toLocaleString()}` : 'never signed in'}
              </p>
            </div>
            {u.id !== currentId && (
              <ConfirmDialog
                title={`Remove ${u.name}?`}
                description="They will no longer be able to sign in."
                confirmLabel="Remove"
                onConfirm={() => run(() => deleteAdminUser(u.id), 'Admin removed', () => router.refresh())}
                trigger={(o) => <Button size="icon-sm" variant="ghost" onClick={o} aria-label="Remove"><Trash2 /></Button>}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <form
          className="space-y-3 rounded-xl border bg-background p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createAdminUser(form), 'Admin added', (r) => {
              if (r.ok) {
                setForm({ name: '', email: '', password: '' });
                router.refresh();
              }
            });
          }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="size-4" /> Add an admin</h2>
          <div className="space-y-1.5"><Label htmlFor="u-name">Name</Label><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label htmlFor="u-pass">Temporary password</Label><Input id="u-pass" type="password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Add admin</Button>
        </form>

        <form
          className="space-y-3 rounded-xl border bg-background p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => changePassword(pw), 'Password changed', (r) => r.ok && setPw({ current: '', next: '' }));
          }}
        >
          <h2 className="text-sm font-semibold">Change your password</h2>
          <div className="space-y-1.5"><Label htmlFor="pw-cur">Current password</Label><Input id="pw-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label htmlFor="pw-new">New password</Label><Input id="pw-new" type="password" autoComplete="new-password" minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
          <Button type="submit" variant="outline" disabled={pending}>Update password</Button>
        </form>
      </div>
    </div>
  );
}
