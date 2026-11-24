'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaPicker, type MediaAccept } from '@/components/admin/media/media-picker';
import { MediaThumb } from '@/components/admin/media/media-thumb';
import type { ResolvedMediaRef } from '@/lib/types';

export function MediaField({
  value,
  onChange,
  accept = 'image',
}: {
  value: ResolvedMediaRef | null;
  onChange: (value: ResolvedMediaRef | null) => void;
  accept?: MediaAccept;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border bg-background p-3">
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => setOpen(true)} className="shrink-0 overflow-hidden rounded-md border">
            <MediaThumb media={value.media} alt={value.alt} className="h-28 w-full object-cover sm:w-40" />
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-muted-foreground">{value.media?.title ?? 'File not found in the library'}</p>
            <div className="space-y-1">
              <label className="text-xs font-medium">Alt text (this placement only)</label>
              <Input
                value={value.alt}
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
                placeholder="Describe the image for screen readers and search engines"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
                <RefreshCw /> Change
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-6 text-sm text-muted-foreground hover:bg-muted/50"
        >
          <ImagePlus className="size-5" />
          Choose from media library
        </button>
      )}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        accept={accept}
        initialAlt={value?.alt}
        onSelect={([ref]) => onChange(ref)}
      />
    </div>
  );
}

export function GalleryField({
  value,
  onChange,
  accept = 'image',
}: {
  value: ResolvedMediaRef[];
  onChange: (value: ResolvedMediaRef[]) => void;
  accept?: MediaAccept;
}) {
  const [open, setOpen] = useState(false);
  const [replaceAt, setReplaceAt] = useState<number | null>(null);
  const list = value ?? [];

  function move(index: number, dir: -1 | 1) {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      {list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((item, i) => (
            <div key={`${item.mediaId}-${i}`} className="flex gap-3 rounded-md border p-2">
              <button
                type="button"
                className="shrink-0 overflow-hidden rounded"
                onClick={() => {
                  setReplaceAt(i);
                  setOpen(true);
                }}
              >
                <MediaThumb media={item.media} alt={item.alt} className="size-20" />
              </button>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  value={item.alt}
                  onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Alt text for this spot"
                  className="h-7 text-xs"
                />
                <div className="flex gap-1">
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                    <ArrowUp />
                  </Button>
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">
                    <ArrowDown />
                  </Button>
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setReplaceAt(null);
          setOpen(true);
        }}
      >
        <ImagePlus /> Add from media library
      </Button>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        accept={accept}
        multiple={replaceAt === null}
        initialAlt={replaceAt !== null ? list[replaceAt]?.alt : undefined}
        onSelect={(refs) => {
          if (replaceAt !== null) onChange(list.map((x, j) => (j === replaceAt ? refs[0] : x)));
          else onChange([...list, ...refs]);
        }}
      />
    </div>
  );
}
