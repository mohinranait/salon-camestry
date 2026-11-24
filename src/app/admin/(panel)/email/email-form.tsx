'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Loader2, PlugZap, Save, Send, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAction } from '@/components/admin/common';
import { SMTP_PRESETS, type SmtpSecurity } from '@/lib/email-presets';
import { saveEmailConfig, sendTestEmail, testEmailConnection, type EmailConfigInput } from './actions';

type Form = {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

const SECURITY_OPTIONS = [
  { value: 'ssl', label: 'SSL / TLS (usually port 465)' },
  { value: 'starttls', label: 'STARTTLS (usually port 587)' },
  { value: 'none', label: 'None (not recommended)' },
];

const presetFor = (host: string) => SMTP_PRESETS.find((p) => p.host && p.host === host)?.id ?? (host ? 'custom' : '');

export function EmailForm({
  initial,
  hasPassword,
  passwordUnreadable,
  envFallback,
  testRecipient,
}: {
  initial: Form;
  hasPassword: boolean;
  passwordUnreadable: boolean;
  envFallback: boolean;
  testRecipient: string;
}) {
  const router = useRouter();
  const save = useAction();
  const test = useAction();
  const send = useAction();
  const [form, setForm] = useState<Form>(initial);
  const [preset, setPreset] = useState(presetFor(initial.host));
  const [tested, setTested] = useState(false);
  const [to, setTo] = useState(testRecipient);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTested(false);
  };
  const payload: EmailConfigInput = form;
  const active = initial.enabled && Boolean(initial.host);
  const presetInfo = SMTP_PRESETS.find((p) => p.id === preset);

  function choosePreset(id: string) {
    setPreset(id);
    const p = SMTP_PRESETS.find((x) => x.id === id);
    if (p && p.host) setForm((f) => ({ ...f, host: p.host, port: p.port, security: p.security }));
    setTested(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        className="space-y-5 rounded-xl border bg-background p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => saveEmailConfig(payload), 'Email settings saved', (r) => {
            if (r.ok) {
              setForm((f) => ({ ...f, password: '' }));
              router.refresh();
            }
          });
        }}
      >
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="em-enabled" className="text-base">Send emails</Label>
            <p className="text-sm text-muted-foreground">When on, the website sends welcome emails, tour emails and your alerts through this server.</p>
          </div>
          <Switch id="em-enabled" checked={form.enabled} onCheckedChange={(c) => set('enabled', Boolean(c))} />
        </div>

        <div className="space-y-1.5">
          <Label>Email provider</Label>
          <Select items={SMTP_PRESETS.map((p) => ({ value: p.id, label: p.label }))} value={preset} onValueChange={(v) => choosePreset(String(v))}>
            <SelectTrigger className="w-full max-w-sm"><SelectValue placeholder="Choose your provider" /></SelectTrigger>
            <SelectContent>
              {SMTP_PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {presetInfo && <p className="text-xs text-muted-foreground">{presetInfo.note}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="em-host">SMTP server</Label>
            <Input id="em-host" value={form.host} onChange={(e) => set('host', e.target.value.trim())} placeholder="smtp.gmail.com" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-port">Port</Label>
            <Input id="em-port" type="number" value={form.port} onChange={(e) => set('port', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Security</Label>
            <Select items={SECURITY_OPTIONS} value={form.security} onValueChange={(v) => set('security', v as SmtpSecurity)}>
              <SelectTrigger className="w-full max-w-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECURITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-user">Username</Label>
            <Input id="em-user" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="Usually your full email address" autoComplete="off" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="em-pass">Password</Label>
            <Input
              id="em-pass"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={hasPassword ? '•••••••••••• saved — leave empty to keep it' : 'SMTP or app password'}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Stored encrypted and never sent back to the browser.</p>
          </div>
        </div>

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="em-from-name">From name</Label>
            <Input id="em-from-name" value={form.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="Shear Chemistry Salon Suites" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-from">From email</Label>
            <Input id="em-from" type="email" value={form.fromEmail} onChange={(e) => set('fromEmail', e.target.value.trim())} placeholder="hello@yourdomain.com" />
            <p className="text-xs text-muted-foreground">Most providers require this to be the account you sign in with, or a verified sender.</p>
          </div>
        </div>

        {passwordUnreadable && (
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" /> The saved password can no longer be decrypted (AUTH_SECRET changed). Enter it again and save.
          </p>
        )}
        {tested && (
          <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> Connected. The server accepted these settings.</p>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="submit" disabled={save.pending}>
            {save.pending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
          <Button type="button" variant="outline" disabled={test.pending} onClick={() => test.run(() => testEmailConnection(payload), undefined, (r) => setTested(r.ok))}>
            {test.pending ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl border bg-background p-4">
          <h2 className="flex items-center justify-between text-sm font-semibold">
            Status
            {active ? <Badge className="bg-emerald-600">Sending</Badge> : envFallback ? <Badge variant="secondary">Using server settings</Badge> : <Badge variant="secondary">Not set up</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">
            {active
              ? `Emails are sent from ${initial.fromEmail} through ${initial.host}.`
              : envFallback
                ? 'Emails use the SMTP details in the server environment until you turn this on.'
                : 'Leads and bookings are saved, but no emails are sent until this is set up.'}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border bg-background p-4">
          <h2 className="text-sm font-semibold">Send a test email</h2>
          <p className="text-xs text-muted-foreground">Uses the settings on the left, even before you save.</p>
          <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" aria-label="Test recipient" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={send.pending}
            onClick={() => send.run(() => sendTestEmail(payload, to), `Test email sent to ${to}`)}
          >
            {send.pending ? <Loader2 className="animate-spin" /> : <Send />} Send test email
          </Button>
        </div>

        <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
          <h2 className="font-semibold">What gets sent</h2>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>Founding Member welcome email</li>
            <li>Tour request received, confirmed and cancelled</li>
            <li>New lead and new tour alerts to you</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Edit the wording and who gets alerts in <Link className="underline" href="/admin/settings">Site settings → Emails</Link>.
          </p>
        </div>
      </aside>
    </div>
  );
}
