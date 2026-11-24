'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { cloudinaryVideoPoster } from '@/lib/cloudinary-url';
import type { ResolvedMediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';

type Group = { id: string; title: string; dateLabel: string; items: ResolvedMediaRef[] };

export function Lightbox({ items, index, onClose, onIndex }: { items: (ResolvedMediaRef & { caption?: string })[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const item = items[index];
  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);
  if (!item?.media) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Media viewer" className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between p-4">
        <span className="text-xs tracking-[0.25em] uppercase opacity-70">
          {index + 1} / {items.length} {item.caption && `· ${item.caption}`}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full border border-white/25">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        {item.media.kind === 'video' ? (
          <video key={item.media.url} src={item.media.url} controls autoPlay playsInline className="max-h-full max-w-full" />
        ) : (
          <div className="relative h-full w-full">
            <Image src={item.media.url} alt={item.alt} fill sizes="100vw" className="object-contain" />
          </div>
        )}
        {items.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Previous" className="absolute left-3 flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <ChevronLeft />
            </button>
            <button type="button" onClick={next} aria-label="Next" className="absolute right-3 flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <ChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function BuildGalleryClient({ groups }: { groups: Group[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [open, setOpen] = useState<number | null>(null);
  const items = groups
    .filter((g) => filter === 'all' || g.id === filter)
    .flatMap((g) => g.items.map((item) => ({ ...item, caption: g.title })));

  if (groups.length === 0) {
    return <p className="opacity-60">Progress photos will appear here as construction moves forward.</p>;
  }

  return (
    <div className="min-w-0 max-w-full">
      <div className="mb-8 flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {[{ id: 'all', title: 'All phases' }, ...groups].map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setFilter(g.id)}
            className={cn(
              'shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors',
              filter === g.id ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/20 hover:border-sc-gold',
            )}
          >
            {g.title}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {items.map((item, i) => (
          <button
            key={`${item.mediaId}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className={cn('group relative overflow-hidden bg-current/5', i % 5 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square')}
          >
            {item.media?.kind === 'video' ? (
              <>
                <video src={item.media.url} poster={cloudinaryVideoPoster(item.media.url)} muted playsInline preload="none" className="absolute inset-0 size-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-sc-black/70 text-sc-gold"><Play className="size-5 fill-current" /></span>
                </span>
              </>
            ) : (
              item.media && (
                <Image
                  src={item.media.url}
                  alt={item.alt}
                  fill
                  sizes={i % 5 === 0 ? '50vw' : '25vw'}
                  placeholder={item.media.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={item.media.blurDataUrl ?? undefined}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-[10px] font-semibold tracking-[0.2em] text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
              {item.caption}
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </div>
  );
}
