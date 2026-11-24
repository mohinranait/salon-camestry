'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, CloudUpload, ExternalLink, Loader2, PlugZap, Save, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAction } from '@/components/admin/common';
import { formatBytes } from '@/components/admin/media/media-client';
import { saveCloudinary, testCloudinary, type CloudinaryInput } from './actions';

type Form = { enabled: boolean; cloudName: string; apiKey: string; apiSecret: string; folder: string };

export function CloudinaryForm({
  initial,
  hasSecret,
  secretUnreadable,
  stats,
}: {
  initial: Form;
  hasSecret: boolean;
  secretUnreadable: boolean;
  stats: { files: number; bytes: number };
}) {
  const router = useRouter();
  const save = useAction();
  const test = useAction();
  const [form, setForm] = useState<Form>(initial);
  const [tested, setTested] = useState<'ok' | 'failed' | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTested(null);
  };
  const connected = initial.enabled && hasSecret;
  const payload: CloudinaryInput = form;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form
        className="space-y-5 rounded-xl border bg-background p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => saveCloudinary(payload), 'Cloudinary settings saved', (r) => {
            if (r.ok) {
              setForm((f) => ({ ...f, apiSecret: '' }));
              router.refresh();
            }
          });
        }}
      >
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="cl-enabled" className="text-base">Upload to Cloudinary</Label>
            <p className="text-sm text-muted-foreground">When on, all uploads from the media library go to your Cloudinary account.</p>
          </div>
          <Switch id="cl-enabled" checked={form.enabled} onCheckedChange={(c) => set('enabled', Boolean(c))} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cl-name">Cloud name</Label>
            <Input id="cl-name" value={form.cloudName} onChange={(e) => set('cloudName', e.target.value)} placeholder="e.g. shearchemistry" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-key">API key</Label>
            <Input id="cl-key" value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} placeholder="123456789012345" autoComplete="off" inputMode="numeric" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cl-secret">API secret</Label>
            <Input
              id="cl-secret"
              type="password"
              value={form.apiSecret}
              onChange={(e) => set('apiSecret', e.target.value)}
              placeholder={hasSecret ? '•••••••••••• saved — leave empty to keep it' : 'Paste your API secret'}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Stored encrypted and never sent back to the browser.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cl-folder">Folder</Label>
            <Input id="cl-folder" value={form.folder} onChange={(e) => set('folder', e.target.value)} placeholder="shear-chemistry" />
            <p className="text-xs text-muted-foreground">Uploads are kept together in this Cloudinary folder.</p>
          </div>
        </div>

        {secretUnreadable && (
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            The saved API secret can no longer be decrypted (AUTH_SECRET changed). Paste the secret again and save.
          </p>
        )}
        {tested === 'ok' && (
          <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> Connected. Cloudinary accepted these credentials.</p>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="submit" disabled={save.pending}>
            {save.pending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={test.pending}
            onClick={() => test.run(() => testCloudinary(payload), undefined, (r) => setTested(r.ok ? 'ok' : 'failed'))}
          >
            {test.pending ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl border bg-background p-4">
          <h2 className="flex items-center justify-between text-sm font-semibold">
            Status
            {connected ? <Badge className="bg-emerald-600">Connected</Badge> : <Badge variant="secondary">Not connected</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.files} file{stats.files === 1 ? '' : 's'} in the library · {formatBytes(stats.bytes)}
          </p>
          {connected && (
            <Button nativeButton={false} variant="outline" size="sm" render={<Link href="/admin/media" />}>
              <CloudUpload /> Upload files
            </Button>
          )}
        </div>
        <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
          <h2 className="font-semibold">Where to find these</h2>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>Sign in to Cloudinary.</li>
            <li>Open <strong>Settings → API Keys</strong>.</li>
            <li>Copy the cloud name, API key and API secret here.</li>
          </ol>
          <a href="https://console.cloudinary.com/settings/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-amber-700 hover:underline">
            Open Cloudinary API keys <ExternalLink className="size-3" />
          </a>
          <p className="pt-2 text-xs text-muted-foreground">Free plan limits: images up to 10 MB, videos up to 100 MB.</p>
        </div>
      </aside>
    </div>
  );
}
