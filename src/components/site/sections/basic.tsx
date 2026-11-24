import { RichText } from '@/components/rich-text';
import { DynamicIcon } from '@/components/icon';
import type { SectionProps } from './types';
import { arr, ButtonLink, Eyebrow, Heading, Highlighted, media, sectionCta, SectionIntro, SectionShell, SiteMedia, str } from '../primitives';
import { cn } from '@/lib/utils';
import type { LinkValue, ResolvedMediaRef } from '@/lib/types';

export function HeroSection({ section, settings, index }: SectionProps) {
  const d = section.data;
  const bg = media(d.background);
  const overlay = Math.min(90, Math.max(0, Number(d.overlay ?? 45)));
  const height = str(d.height) || 'full';
  const cta = sectionCta(d, settings);
  const secondary = d.secondaryCta as LinkValue | undefined;
  const badges = arr<string>(d.badges);

  return (
    <SectionShell theme={section.theme} anchor={section.anchor} bleed className="overflow-hidden">
      <div
        className={cn(
          'relative flex items-end',
          height === 'full' ? 'min-h-svh' : height === 'large' ? 'min-h-[80svh]' : 'min-h-[60svh]',
        )}
      >
        {bg && (
          <div className="absolute inset-0">
            <SiteMedia value={bg} priority={index === 0} background className="scale-[1.02]" />
            <div className="absolute inset-0 bg-sc-black" style={{ opacity: overlay / 100 }} />
            <div className="absolute inset-0 bg-linear-to-t from-sc-black via-sc-black/30 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto w-full max-w-7xl px-5 pt-36 pb-16 sm:px-8 md:pb-24">
          <div className="max-w-4xl space-y-7">
            <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
            <h1 className="reveal font-display text-[44px] leading-[0.98] font-medium tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-[88px]">
              <Highlighted text={str(d.heading)} highlight={str(d.highlight)} />
            </h1>
            <RichText text={d.subheading} className="reveal max-w-2xl text-base leading-relaxed opacity-80 md:text-xl" />
            <div className="reveal flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <ButtonLink link={cta} />
              <ButtonLink link={secondary} variant="outline" />
            </div>
            {badges.length > 0 && (
              <ul className="reveal flex flex-wrap gap-x-6 gap-y-2 pt-4 text-[11px] font-semibold tracking-[0.25em] uppercase opacity-70">
                {badges.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="size-1 rotate-45 bg-sc-gold" /> {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function PageHeaderSection({ section, index }: SectionProps) {
  const d = section.data;
  const bg = media(d.background);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor} bleed className="overflow-hidden">
      <div className="relative">
        {bg && (
          <div className="absolute inset-0">
            <SiteMedia value={bg} priority={index === 0} background />
            <div className="absolute inset-0 bg-sc-black/65" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-5 pt-40 pb-16 sm:px-8 md:pt-48 md:pb-24">
          <div className="max-w-3xl space-y-6">
            <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
            <Heading as="h1" className="reveal md:text-7xl">{str(d.heading)}</Heading>
            <RichText text={d.intro} className="reveal text-lg leading-relaxed opacity-75" />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function StatsSection({ section }: SectionProps) {
  const items = arr<{ value: string; suffix: string; label: string }>(section.data.items);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor} bleed>
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 md:grid-cols-4">
        {items.map((s, i) => (
          <div key={i} className={cn('reveal border-current/10 py-10 md:py-14', i % 2 === 1 && 'border-l pl-6', i >= 2 && 'border-t md:border-t-0', i > 0 && 'md:border-l md:pl-8')}>
            <p className="font-display whitespace-nowrap text-4xl font-medium text-sc-gold sm:text-5xl md:text-6xl">
              {s.value}
              {s.suffix && <span className="ml-1 font-sans text-[10px] sm:text-sm font-semibold tracking-[0.2em] uppercase opacity-70">{s.suffix}</span>}
            </p>
            <p className="mt-2 text-[11px] font-semibold tracking-[0.25em] uppercase opacity-65">{s.label}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

type Element = { symbol: string; icon: string; title: string; description: string };

export function FormulaSection({ section }: SectionProps) {
  const d = section.data;
  const items = arr<Element>(d.items);
  const image = media(d.image);
  const dark = section.theme === 'dark';
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className={cn('grid gap-12', image && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start')}>
        <div className={cn(image && 'lg:sticky lg:top-28')}>
          <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} className="mb-8" />
          {image && (
            <div className="reveal relative hidden aspect-4/5 overflow-hidden rounded-[xs lg:block">
              <SiteMedia value={image} sizes="40vw" />
            </div>
          )}
        </div>
        <div className={cn('grid gap-px overflow-hidden rounded-xs sm:grid-cols-2', dark ? 'bg-sc-gold/25' : 'bg-sc-charcoal/10', !image && 'lg:grid-cols-3')}>
          {items.map((el, i) => (
            <article key={i} className={cn('reveal group relative flex min-h-64 flex-col p-7 transition-colors duration-500', dark ? 'bg-sc-black hover:bg-[#151515]' : 'bg-white hover:bg-sc-ivory')}>
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-sc-gold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <DynamicIcon name={el.icon} className="size-5 text-sc-gold opacity-80" />
              </div>
              <p className="mt-6 font-display text-6xl leading-none font-medium transition-colors duration-500 group-hover:text-sc-gold">{el.symbol}</p>
              <h3 className="mt-auto pt-6 text-sm font-semibold tracking-[0.12em] uppercase">{el.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{el.description}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function SplitContentSection({ section, settings }: SectionProps) {
  const d = section.data;
  const image = media(d.image);
  const left = str(d.imagePosition) === 'left';
  const bullets = arr<string>(d.bullets);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={cn('space-y-6', left && 'lg:order-2')}>
          <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
          <Heading className="reveal">{str(d.heading)}</Heading>
          <RichText text={d.body} className="reveal text-base leading-relaxed opacity-75 md:text-lg" />
          {bullets.length > 0 && (
            <ul className="reveal grid gap-3 pt-2 sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-sc-gold" /> {b}
                </li>
              ))}
            </ul>
          )}
          <div className="reveal pt-3">
            <ButtonLink link={sectionCta(d, settings)} />
          </div>
        </div>
        {image && (
          <div className={cn('reveal relative', left && 'lg:order-1')}>
            <div className="absolute -inset-3 z-0 hidden border border-sc-gold/40 md:block" style={{ transform: left ? 'translate(-14px, 14px)' : 'translate(14px, 14px)' }} />
            <div className="relative aspect-4/5 overflow-hidden">
              <SiteMedia value={image} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

export function CtaBannerSection({ section, settings }: SectionProps) {
  const d = section.data;
  const bg = media(d.background);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor} bleed className="overflow-hidden">
      <div className="relative">
        {bg && (
          <div className="absolute inset-0">
            <SiteMedia value={bg} background />
            <div className="absolute inset-0 bg-sc-black/75" />
          </div>
        )}
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 md:py-32">
          <Eyebrow className="reveal justify-center">{str(d.eyebrow)}</Eyebrow>
          <Heading className="reveal mt-6 md:text-7xl">{str(d.heading)}</Heading>
          <RichText text={d.intro} className="reveal mx-auto mt-6 max-w-2xl text-lg opacity-75" />
          <div className="reveal mt-10">
            <ButtonLink link={sectionCta(d, settings)} />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function RichTextSection({ section }: SectionProps) {
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="mx-auto max-w-3xl">
        <Heading className="mb-8 md:text-5xl">{str(section.data.heading)}</Heading>
        <RichText text={section.data.body} className="text-base leading-relaxed opacity-80" />
      </div>
    </SectionShell>
  );
}

export function GallerySection({ section }: SectionProps) {
  const d = section.data;
  const items = arr<ResolvedMediaRef>(d.items).filter((i) => i.media);
  const masonry = str(d.layout) !== 'grid';
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} />
      <div className={masonry ? 'columns-2 gap-3 md:columns-3 *:mb-3' : 'grid grid-cols-2 gap-3 md:grid-cols-3'}>
        {items.map((item, i) => (
          <figure key={i} className={cn('reveal relative overflow-hidden', !masonry && 'aspect-square')}>
            <SiteMedia value={item} fill={!masonry} sizes="(min-width: 768px) 33vw, 50vw" className={masonry ? 'h-auto w-full' : ''} />
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}
