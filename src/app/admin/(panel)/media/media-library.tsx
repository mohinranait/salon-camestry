'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/admin/common';
import { ACCEPT_ATTR, fetchMedia, formatBytes } from '@/components/admin/media/media-client';
import { MediaThumb } from '@/components/admin/media/media-thumb';
import { UploadZone } from '@/components/admin/media/upload-zone';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

type Usage = { label: string; href: string };

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MediaItem | null>(null);

  const load = useCallback(
    async (p: number, replace: boolean) => {
      setLoading(true);
      try {
        const res = await fetchMedia({ q, kind, page: p, perPage: 48 });
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
        setHasMore(res.hasMore);
        setPage(p);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load media');
      } finally {
        setLoading(false);
      }
    },
    [q, kind],
  );

  useEffect(() => {
    const t = setTimeout(() => void load(1, true), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div className="space-y-5">
      <UploadZone onUploaded={(up) => setItems((prev) => [...up, ...prev])} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, filename, alt text or tag" className="bg-background pl-8" />
        </div>
        <div className="flex rounded-lg border bg-background p-0.5">
          {['all', 'image', 'video', 'document'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn('rounded-md px-3 py-1 text-xs capitalize', kind === k ? 'bg-foreground text-background' : 'text-muted-foreground')}
            >
              {k === 'all' ? 'All' : `${k}s`}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <p className="rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">No files yet. Upload some above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="group overflow-hidden rounded-lg border bg-background text-left transition hover:border-foreground/40 hover:shadow-sm"
            >
              <MediaThumb media={item} className="aspect-square w-full" />
              <span className="block truncate px-2 pt-1.5 text-xs font-medium">{item.title}</span>
              <span className="block px-2 pb-1.5 text-[11px] text-muted-foreground">
                {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                {formatBytes(item.size)}
              </span>
            </button>
          ))}
        </div>
      )}

      {(hasMore || loading) && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={loading} onClick={() => void load(page + 1, false)}>
            {loading && <Loader2 className="animate-spin" />} {loading ? 'Loading' : 'Load more'}
          </Button>
        </div>
      )}

      <MediaDetails
        key={active?.id ?? 'none'}
        item={active}
        onClose={() => setActive(null)}
        onChange={(updated) => {
          setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setActive(updated);
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((p) => p.id !== id));
          setActive(null);
        }}
      />
    </div>
  );
}

function MediaDetails({
  item,
  onClose,
  onChange,
  onDeleted,
}: {
  item: MediaItem | null;
  onClose: () => void;
  onChange: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  // The parent re-mounts this component per file (key), so props seed the form once.
  const [title, setTitle] = useState(item?.title ?? '');
  const [alt, setAlt] = useState(item?.defaultAlt ?? '');
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '');
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const replaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!item) return;
    fetch(`/api/admin/media/${item.id}`)
      .then((r) => r.json())
      .then((d) => setUsage(d.usage ?? []))
      .catch(() => setUsage([]));
  }, [item]);

  if (!item) return <Sheet open={false} />;

  async function save() {
    if (!item) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, defaultAlt: alt, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      onChange(body.item);
      toast.success('Details saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function replace(file: File | undefined) {
    if (!file || !item) return;
    setReplacing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/admin/media/${item.id}`, { method: 'PUT', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      onChange(body.item);
      toast.success('File replaced everywhere it is used');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not replace the file');
    } finally {
      setReplacing(false);
      if (replaceInput.current) replaceInput.current.value = '';
    }
  }

  async function remove() {
    if (!item) return;
    const res = await fetch(`/api/admin/media/${item.id}?force=1`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not delete the file');
      return;
    }
    toast.success('File deleted');
    onDeleted(item.id);
  }

  const absoluteUrl = typeof window !== 'undefined' ? `${window.location.origin}${item.url}` : item.url;

  return (
    <Sheet open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription className="truncate">{item.originalName}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {item.kind === 'video' ? (
            <video src={item.url} controls className="w-full rounded-lg bg-black" />
          ) : (
            <MediaThumb media={item} className="max-h-72 w-full rounded-lg object-contain" />
          )}
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{item.mimeType}</dd>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{formatBytes(item.size)}</dd>
            {item.width && (
              <>
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd>{item.width} × {item.height}px</dd>
              </>
            )}
            <dt className="text-muted-foreground">Uploaded</dt>
            <dd>{new Date(item.createdAt).toLocaleString()}</dd>
          </dl>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-title">Title</Label>
              <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-alt">Suggested alt text</Label>
              <Textarea id="m-alt" rows={3} value={alt} onChange={(e) => setAlt(e.target.value)} />
              <p className="text-xs text-muted-foreground">Pre-fills the alt text when this file is placed somewhere new. Each placement can still use its own description.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-tags">Tags</Label>
              <Input id="m-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="construction, suites, hero" />
            </div>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Save details
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Used in</Label>
            {usage === null ? (
              <p className="text-xs text-muted-foreground">Checking…</p>
            ) : usage.length === 0 ? (
              <p className="text-xs text-muted-foreground">Not used anywhere yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {usage.map((u, i) => (
                  <Badge key={i} variant="secondary" render={<Link href={u.href} />}>{u.label}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(absoluteUrl);
                toast.success('Link copied');
              }}
            >
              <Copy /> Copy link
            </Button>
            <input ref={replaceInput} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => void replace(e.target.files?.[0])} />
            <Button variant="outline" size="sm" disabled={replacing} onClick={() => replaceInput.current?.click()}>
              {replacing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Replace file
            </Button>
            <ConfirmDialog
              title="Delete this file?"
              description={
                usage && usage.length
                  ? `It is used in ${usage.length} place${usage.length > 1 ? 's' : ''}. Those spots will show nothing until you pick another file.`
                  : 'The file is permanently removed from the library.'
              }
              onConfirm={remove}
              trigger={(o) => (
                <Button variant="destructive" size="sm" onClick={o}>
                  <Trash2 /> Delete
                </Button>
              )}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
