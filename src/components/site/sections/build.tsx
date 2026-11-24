import { Check, Loader, Clock3 } from 'lucide-react';
import { RichText } from '@/components/rich-text';
import { buildProgress, getMilestones } from '@/lib/server/data';
import type { LinkValue, MilestoneDoc } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EvolutionGauge } from '../gauge';
import { ButtonLink, Eyebrow, Heading, media, SectionIntro, SectionShell, SiteMedia, str } from '../primitives';
import { BuildGalleryClient } from './build-gallery-client';
import type { SectionProps } from './types';

const STATUS = {
  completed: { label: 'Completed', icon: Check, className: 'bg-sc-gold text-sc-black' },
  'in-progress': { label: 'In progress', icon: Loader, className: 'border border-sc-gold text-sc-gold' },
  upcoming: { label: 'Upcoming', icon: Clock3, className: 'border border-current/25 opacity-70' },
} as const;

function StatusBadge({ status }: { status: MilestoneDoc['status'] }) {
  const s = STATUS[status] ?? STATUS.upcoming;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase', s.className)}>
      <s.icon className="size-3" /> {s.label}
    </span>
  );
}

export async function BuildTeaserSection({ section, settings }: SectionProps) {
  const d = section.data;
  const milestones = await getMilestones();
  const progress = buildProgress(milestones);
  const image = media(d.image);
  const latest =
    [...milestones].reverse().find((m) => m.status !== 'upcoming' && m.gallery.length) ??
    milestones.find((m) => m.status === 'in-progress');
  const thumbs = (latest?.gallery ?? []).filter((g) => g.media?.kind === 'image').slice(0, 3);

  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="space-y-6">
          <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
          <Heading className="reveal">{str(d.heading)}</Heading>
          <RichText text={d.intro} className="reveal text-base leading-relaxed opacity-75 md:text-lg" />
          {latest && (
            <div className="reveal space-y-3 border-l-2 border-sc-gold pl-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={latest.status} />
                <span className="text-xs tracking-[0.2em] uppercase opacity-60">{latest.dateLabel}</span>
              </div>
              <p className="font-display text-2xl">{latest.title}</p>
              <RichText text={latest.caption} className="text-sm leading-relaxed opacity-70" />
            </div>
          )}
          <div className="reveal pt-2">
            <ButtonLink link={d.cta as LinkValue} variant="outline" />
          </div>
        </div>
        <div className="reveal space-y-8">
          <EvolutionGauge progress={progress} milestones={milestones} label={`To ${settings.phase.openingLabel} opening`} />
          {image ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <SiteMedia value={image} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          ) : (
            thumbs.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {thumbs.map((t, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden">
                    <SiteMedia value={t} sizes="20vw" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export async function MilestonesSection({ section, settings }: SectionProps) {
  const d = section.data;
  const milestones = await getMilestones();
  const progress = buildProgress(milestones);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="grid gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} className="mb-10" />
          {d.showGauge !== false && <EvolutionGauge progress={progress} milestones={milestones} label={`To ${settings.phase.openingLabel} opening`} />}
        </div>
        <ol className="relative">
          <span className="absolute top-2 bottom-2 left-[15px] w-px bg-gradient-to-b from-sc-gold via-sc-gold/40 to-transparent" aria-hidden />
          {milestones.map((m, i) => (
            <li key={m.id} className="reveal relative pb-14 pl-14 last:pb-0">
              <span
                className={cn(
                  'absolute top-0 left-0 flex size-8 items-center justify-center rounded-full font-display text-sm',
                  m.status === 'completed' ? 'bg-sc-gold text-sc-black' : m.status === 'in-progress' ? 'border-2 border-sc-gold bg-sc-black text-sc-gold' : 'border border-current/30',
                )}
              >
                {m.status === 'in-progress' && <span className="absolute inset-0 animate-ping rounded-full border border-sc-gold/60" />}
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={m.status} />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase opacity-60">{m.dateLabel}</span>
              </div>
              <h3 className="mt-3 font-display text-3xl md:text-4xl">{m.title}</h3>
              <RichText text={m.caption} className="mt-3 max-w-xl text-sm leading-relaxed opacity-70 md:text-base" />
              {m.gallery.length > 0 && (
                <div className="mt-5 grid max-w-xl grid-cols-3 gap-2">
                  {m.gallery.slice(0, 3).map((g, j) => (
                    <div key={j} className="relative aspect-square overflow-hidden bg-current/5">
                      <SiteMedia value={g} sizes="15vw" background />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}

export async function BuildGallerySection({ section }: SectionProps) {
  const d = section.data;
  const milestones = await getMilestones();
  const groups = milestones
    .filter((m) => m.gallery.some((g) => g.media))
    .map((m) => ({ id: m.id, title: m.title, dateLabel: m.dateLabel, items: m.gallery.filter((g) => g.media) }));
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} />
      <BuildGalleryClient groups={groups} />
    </SectionShell>
  );
}
