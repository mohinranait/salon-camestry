'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ImageIcon, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MediaItem, ResolvedMediaRef } from '@/lib/types';
import { fetchMedia, formatBytes } from './media-client';
import { MediaThumb } from './media-thumb';
import { UploadZone } from './upload-zone';

export type MediaAccept = 'image' | 'video' | 'any';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accept?: MediaAccept;
  multiple?: boolean;
  /** Alt text of the placement being edited, when replacing an existing image. */
  initialAlt?: string;
  onSelect: (refs: ResolvedMediaRef[]) => void;
};

function toRef(item: MediaItem, alt: string): ResolvedMediaRef {
  const { id, url, kind, mimeType, width, height, blurDataUrl, title } = item;
  return { mediaId: id, alt, media: { id, url, kind, mimeType, width, height, blurDataUrl, title } };
}

/**
 * The media library modal. Every image or video on the site is picked through
 * it: the file comes from the shared library, while the alt text typed here
 * belongs only to this placement.
 */
export function MediaPicker(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex h-[88vh] w-full flex-col gap-0 p-0 sm:max-w-6xl">
        {/* Mounted per opening, so every pick starts from a clean state. */}
        {props.open && <PickerBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({ open, onOpenChange, accept = 'image', multiple = false, initialAlt, onSelect }: Props) {
  const [tab, setTab] = useState<string>('library');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<string>(accept === 'any' ? 'all' : accept);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [alt, setAlt] = useState(initialAlt ?? '');
  const requestId = useRef(0);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const res = await fetchMedia({ q, kind, page: nextPage, perPage: 40 });
        if (id !== requestId.current) return;
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
        setHasMore(res.hasMore);
        setPage(nextPage);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [q, kind],
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(1, true), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, load, q]);

  function toggle(item: MediaItem) {
    if (multiple) {
      setSelected((prev) => (prev.some((p) => p.id === item.id) ? prev.filter((p) => p.id !== item.id) : [...prev, item]));
    } else {
      setSelected([item]);
      // A fresh pick starts from the file's suggested alt text unless the placement already has one.
      setAlt((current) => (initialAlt ? current : item.defaultAlt));
    }
  }

  function confirm() {
    if (selected.length === 0) return;
    const refs = multiple ? selected.map((s) => toRef(s, s.defaultAlt)) : [toRef(selected[0], alt.trim())];
    onSelect(refs);
    onOpenChange(false);
  }

  function handleUploaded(uploaded: MediaItem[]) {
    const usable = uploaded.filter((u) => accept === 'any' || u.kind === accept);
    setItems((prev) => [...uploaded, ...prev.filter((p) => !uploaded.some((u) => u.id === p.id))]);
    if (usable.length) {
      if (multiple) setSelected((prev) => [...prev, ...usable]);
      else {
        setSelected([usable[0]]);
        if (!initialAlt) setAlt(usable[0].defaultAlt);
      }
    }
    setTab('library');
  }

  const focus = selected[selected.length - 1];
  const kindOptions = accept === 'any' ? ['all', 'image', 'video'] : [accept];

  return (
    <>
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4" /> Media library
          </DialogTitle>
          <DialogDescription>
            {multiple ? 'Select one or more files.' : 'Select a file, then describe it for this spot.'} Files are shared across the whole site.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-h-0 flex-1 gap-0">
          <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload new</TabsTrigger>
            </TabsList>
            {tab === 'library' && (
              <>
                <div className="relative ml-auto w-full max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, filename, tags" className="pl-8" />
                </div>
                {kindOptions.length > 1 && (
                  <div className="flex rounded-lg border p-0.5">
                    {kindOptions.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={cn('rounded-md px-2.5 py-1 text-xs capitalize', kind === k ? 'bg-foreground text-background' : 'text-muted-foreground')}
                      >
                        {k === 'all' ? 'All' : `${k}s`}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <TabsContent value="library" className="flex min-h-0 flex-1">
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {items.length === 0 && !loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <ImageIcon className="size-10" />
                  <p>{q ? 'No files match your search.' : 'The library is empty.'}</p>
                  <Button variant="outline" onClick={() => setTab('upload')}>Upload files</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((item) => {
                    const index = selected.findIndex((s) => s.id === item.id);
                    const disabled = accept !== 'any' && item.kind !== accept;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(item)}
                        onDoubleClick={() => {
                          if (!multiple) {
                            setSelected([item]);
                            onSelect([toRef(item, (initialAlt || alt || item.defaultAlt).trim())]);
                            onOpenChange(false);
                          }
                        }}
                        className={cn(
                          'group relative overflow-hidden rounded-lg border text-left transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                          index >= 0 ? 'border-amber-500 ring-2 ring-amber-500' : 'hover:border-foreground/40',
                          disabled && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        <MediaThumb media={item} className="aspect-square w-full" />
                        <span className="block truncate px-2 py-1.5 text-xs">{item.title}</span>
                        {index >= 0 && (
                          <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                            {multiple ? index + 1 : <Check className="size-3.5" />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {(hasMore || loading) && (
                <div className="mt-5 flex justify-center">
                  <Button variant="outline" disabled={loading} onClick={() => void load(page + 1, false)}>
                    {loading && <Loader2 className="animate-spin" />} {loading ? 'Loading' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>

            <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-muted/30 p-5 md:flex">
              {focus ? (
                <>
                  <MediaThumb media={focus} className="aspect-[4/3] w-full rounded-lg object-contain" />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">{focus.title}</p>
                    <p className="truncate">{focus.originalName}</p>
                    <p>
                      {focus.width && focus.height ? `${focus.width} × ${focus.height} · ` : ''}
                      {formatBytes(focus.size)}
                    </p>
                  </div>
                  {multiple ? (
                    <p className="rounded-lg bg-background p-3 text-xs text-muted-foreground">
                      {selected.length} selected. Each file starts with its suggested alt text; you can write a different description for each one after inserting.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="placement-alt">Alt text for this placement</Label>
                      <Textarea
                        id="placement-alt"
                        rows={4}
                        value={alt}
                        onChange={(e) => setAlt(e.target.value)}
                        placeholder="Describe what this image shows here, for screen readers and Google"
                      />
                      <p className="text-xs text-muted-foreground">
                        Only applies here. The same file used elsewhere keeps its own description.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                  Select a file to see its details.
                </div>
              )}
            </aside>
          </TabsContent>

          <TabsContent value="upload" className="min-h-0 flex-1 overflow-y-auto p-5">
            <UploadZone onUploaded={handleUploaded} className="h-full min-h-64" />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {selected.length ? `${selected.length} selected` : 'Nothing selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={selected.length === 0}>
              {multiple ? `Insert ${selected.length || ''}`.trim() : 'Use this file'}
            </Button>
          </div>
        </div>
    </>
  );
}
