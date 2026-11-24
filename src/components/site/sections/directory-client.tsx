'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { Instagram } from '@/components/brand-icons';
import type { MemberDoc } from '@/lib/types';
import { cn } from '@/lib/utils';

export function DirectoryClient({ members, specialties, emptyMessage }: { members: MemberDoc[]; specialties: string[]; emptyMessage: string }) {
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    return members
      .filter((m) => filter === 'All' || m.specialty === filter)
      .filter((m) => !needle || `${m.name} ${m.businessName} ${m.bio}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [members, filter, q]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {['All', ...specialties].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={cn(
                'shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors',
                filter === s ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/20 hover:border-sc-gold',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search pros</span>
          <Search className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 opacity-50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or business"
            className="w-full border-0 border-b border-current/25 bg-transparent py-2.5 pl-7 text-sm outline-none focus:border-sc-gold"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center opacity-60">{emptyMessage || 'No pros match this filter yet.'}</p>
      ) : (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <article key={m.id} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-current/5">
                {m.headshot?.media && (
                  <Image
                    src={m.headshot.media.url}
                    alt={m.headshot.alt || m.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <span className="absolute top-4 left-4 rounded-full bg-sc-black/80 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-sc-gold uppercase backdrop-blur">
                  Suite {m.suiteNumber}
                </span>
                {m.featured && (
                  <span className="absolute top-4 right-4 rounded-full bg-sc-gold px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-sc-black uppercase">Featured</span>
                )}
              </div>
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.25em] text-sc-gold uppercase">{m.specialty}</p>
                <h3 className="font-display text-3xl">{m.name}</h3>
                {m.businessName && <p className="text-sm opacity-70">{m.businessName}</p>}
                <p className="line-clamp-3 text-sm leading-relaxed opacity-65">{m.bio}</p>
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {m.bookingUrl && (
                    <a href={m.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sc-gold px-5 text-[12px] font-semibold tracking-[0.14em] text-sc-black uppercase hover:bg-sc-gold-light">
                      Book now <ArrowUpRight className="size-4" />
                    </a>
                  )}
                  {m.instagram && (
                    <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm opacity-80 hover:text-sc-gold">
                      <Instagram className="size-4" /> @{m.instagram}
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
