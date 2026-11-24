'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { RichText } from '@/components/rich-text';
import { cn } from '@/lib/utils';

type Item = { category: string; question: string; answer: string };

export function FaqClient({ items }: { items: Item[] }) {
  const categories = useMemo(() => ['All', ...new Set(items.map((i) => i.category).filter(Boolean))], [items]);
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState<number | null>(0);
  const visible = items.filter((i) => category === 'All' || i.category === category);

  return (
    <div>
      {categories.length > 2 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setOpen(null);
              }}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors',
                category === c ? 'border-sc-gold bg-sc-gold text-sc-black' : 'border-current/20 hover:border-sc-gold',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="divide-y divide-current/10 border-y border-current/10">
        {visible.map((item, i) => {
          const isOpen = open === i;
          const id = `faq-${i}`;
          return (
            <div key={item.question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display text-xl md:text-2xl">{item.question}</span>
                  <Plus className={cn('mt-1 size-5 shrink-0 text-sc-gold transition-transform duration-300', isOpen && 'rotate-45')} />
                </button>
              </h3>
              <div id={id} role="region" className={cn('grid transition-all duration-500', isOpen ? 'grid-rows-[1fr] pb-6 opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <div className="overflow-hidden">
                  <RichText text={item.answer} className="max-w-2xl text-sm leading-relaxed opacity-75 md:text-base" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
