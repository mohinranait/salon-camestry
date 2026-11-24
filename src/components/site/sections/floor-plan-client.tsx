'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ResolvedMediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';

export type Hotspot = { x: number; y: number; label: string; title: string; description: string };

export function FloorPlanClient({ image, hotspots }: { image: ResolvedMediaRef; hotspots: Hotspot[] }) {
  const [active, setActive] = useState<number | null>(null);
  const m = image.media!;
  const current = active !== null ? hotspots[active] : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="reveal relative overflow-hidden border border-current/10 bg-white">
        <Image
          src={m.url}
          alt={image.alt}
          width={m.width ?? 1600}
          height={m.height ?? 1000}
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="h-auto w-full"
        />
        {hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            aria-label={h.title}
            aria-pressed={active === i}
            onClick={() => setActive(active === i ? null : i)}
            onMouseEnter={() => setActive(i)}
            className={cn(
              'absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-all md:size-9',
              active === i ? 'scale-110 border-sc-black bg-sc-black text-sc-gold' : 'border-white bg-sc-gold text-sc-black',
            )}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            {active !== i && <span className="absolute inset-0 animate-ping rounded-full bg-sc-gold/40" />}
            <span className="relative">{h.label}</span>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <div className="min-h-40 border border-sc-gold/40 p-6">
          {current ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.3em] text-sc-gold uppercase">Callout {current.label}</p>
              <h3 className="mt-2 font-display text-3xl">{current.title}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-70">{current.description}</p>
            </>
          ) : (
            <p className="text-sm opacity-60">Tap a gold marker on the plan to see what&apos;s there.</p>
          )}
        </div>
        <ol className="divide-y divide-current/10 border-y border-current/10 text-sm">
          {hotspots.map((h, i) => (
            <li key={i}>
              <button type="button" onClick={() => setActive(i)} className={cn('flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:text-sc-gold', active === i && 'text-sc-gold')}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/30 text-[10px] font-bold">{h.label}</span>
                {h.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
