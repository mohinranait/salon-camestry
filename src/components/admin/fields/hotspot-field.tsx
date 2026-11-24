'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ResolvedMediaRef } from '@/lib/types';

export type Hotspot = { x: number; y: number; label: string; title: string; description: string };

/** Click on the plan image to drop a numbered callout, then describe it. */
export function HotspotField({
  image,
  value,
  onChange,
}: {
  image: ResolvedMediaRef | null | undefined;
  value: Hotspot[];
  onChange: (value: Hotspot[]) => void;
}) {
  const list = value ?? [];
  if (!image?.media) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Choose the floor plan image first, then click on it to add callouts.</p>;
  }

  function add(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange([...list, { x, y, label: String(list.length + 1), title: 'New callout', description: '' }]);
  }

  const update = (i: number, patch: Partial<Hotspot>) => onChange(list.map((h, j) => (j === i ? { ...h, ...patch } : h)));

  return (
    <div className="space-y-3">
      <div className="relative cursor-crosshair overflow-hidden rounded-lg border" onClick={add}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.media.url} alt={image.alt} className="w-full select-none" draggable={false} />
        {list.map((h, i) => (
          <span
            key={i}
            className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-amber-600 text-[11px] font-bold text-white shadow"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            {h.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Click the plan to add a callout. Positions are saved as percentages, so they stay correct at every screen size.</p>
      {list.map((h, i) => (
        <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[4rem_1fr_auto]">
          <Input value={h.label} onChange={(e) => update(i, { label: e.target.value })} aria-label="Marker label" />
          <div className="space-y-2">
            <Input value={h.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title, e.g. Wash & Dry Lounge" />
            <Textarea rows={2} value={h.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Short description" />
            <div className="flex gap-2 text-xs text-muted-foreground">
              <label className="flex items-center gap-1">
                X%
                <Input type="number" className="h-7 w-20" value={h.x} onChange={(e) => update(i, { x: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-1">
                Y%
                <Input type="number" className="h-7 w-20" value={h.y} onChange={(e) => update(i, { y: Number(e.target.value) })} />
              </label>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove callout">
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}
