import { Instagram } from '@/components/brand-icons';
import { RichText } from '@/components/rich-text';
import { DynamicIcon } from '@/components/icon';
import { getRawSettings, getSuites } from '@/lib/server/data';
import type { ResolvedMediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { arr, ButtonLink, media, sectionCta, SectionIntro, SectionShell, SiteMedia, str } from '../primitives';
import { FaqClient } from './faq-client';
import { FloorPlanClient, type Hotspot } from './floor-plan-client';
import type { SectionProps } from './types';

export async function SuiteTypesSection({ section, settings }: SectionProps) {
  const d = section.data;
  const suites = await getSuites();
  const included = arr<string>(d.included);
  const total = suites.reduce((s, x) => s + x.count, 0);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} />
      <div className="grid gap-6 md:grid-cols-2">
        {suites.map((s) => (
          <article key={s.id} className="reveal group flex flex-col overflow-hidden border border-current/10 bg-current/[0.02]">
            <div className="relative aspect-[16/10] overflow-hidden bg-sc-black">
              {s.image && <SiteMedia value={s.image} sizes="(min-width: 768px) 50vw, 100vw" className="transition-transform duration-1000 group-hover:scale-105" />}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="rounded-full bg-sc-black/80 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-sc-gold uppercase backdrop-blur">{s.size}</span>
                <span className="rounded-full bg-sc-black/80 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-sc-ivory uppercase backdrop-blur">{s.wetDry}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-7">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-3xl">{s.name}</h3>
                <p className="shrink-0 text-right">
                  <span className="font-display text-3xl text-sc-gold">{s.count}</span>
                  <span className="block text-[10px] tracking-[0.2em] uppercase opacity-60">suites</span>
                </p>
              </div>
              <p className="text-sm leading-relaxed opacity-75">{s.summary}</p>
              <RichText text={s.description} className="text-sm leading-relaxed opacity-65" />
              {s.features.length > 0 && (
                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-sc-gold" /> {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-current/10 pt-4 text-xs tracking-[0.15em] uppercase">
                <span className="opacity-60">{s.sqft}</span>
                <span className="text-sc-gold">{s.available > 0 ? `${s.available} available` : 'Waitlist only'}</span>
                {s.priceLabel && <span className="w-full opacity-60 normal-case tracking-normal">{s.priceLabel}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {included.length > 0 && (
        <div className="reveal mt-12 grid gap-8 border border-sc-gold/40 p-7 md:grid-cols-[14rem_1fr] md:p-10">
          <div>
            <p className="font-display text-6xl text-sc-gold">{total}</p>
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase opacity-70">Turnkey suites, all including</p>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {included.map((i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-sc-gold" /> {i}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="reveal mt-12 text-center">
        <ButtonLink link={sectionCta(d, settings)} />
      </div>
    </SectionShell>
  );
}

export function FloorPlanSection({ section }: SectionProps) {
  const d = section.data;
  const image = media(d.image);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} />
      {image?.media && <FloorPlanClient image={image} hotspots={arr<Hotspot>(d.hotspots)} />}
    </SectionShell>
  );
}

type InstaPost = { image: string; alt: string; href: string; caption: string; video?: boolean };

async function liveInstagram(token: string, limit: number): Promise<InstaPost[] | null> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${limit}&access_token=${encodeURIComponent(token)}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { caption?: string; media_type: string; media_url: string; thumbnail_url?: string; permalink: string }[] };
    return (body.data ?? []).map((p) => ({
      image: p.media_type === 'VIDEO' ? p.thumbnail_url ?? p.media_url : p.media_url,
      alt: p.caption?.slice(0, 120) ?? 'Instagram post',
      href: p.permalink,
      caption: p.caption ?? '',
      video: p.media_type === 'VIDEO',
    }));
  } catch {
    return null;
  }
}

export async function InstagramSection({ section, settings }: SectionProps) {
  const d = section.data;
  const limit = Math.min(12, Math.max(3, Number(d.limit ?? 6)));
  const raw = await getRawSettings();
  const handle = settings.social.instagramHandle;
  const profile = settings.social.instagramUrl || `https://instagram.com/${handle}`;
  const live = raw.instagram.accessToken ? await liveInstagram(raw.instagram.accessToken, limit) : null;
  const fallback = arr<{ image: ResolvedMediaRef | null; caption: string; href: string }>(d.posts).filter((p) => p.image?.media).slice(0, limit);

  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} className="mb-0 md:mb-0" />
        <ButtonLink link={{ label: `@${handle}`, href: profile }} variant="outline" className="reveal shrink-0" />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
        {live
          ? live.map((p, i) => (
              <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="reveal group relative aspect-square overflow-hidden bg-current/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.alt} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <InstaOverlay />
              </a>
            ))
          : fallback.map((p, i) => (
              <a key={i} href={p.href || profile} target="_blank" rel="noopener noreferrer" className="reveal group relative aspect-square overflow-hidden bg-current/5">
                <SiteMedia value={p.image} sizes="(min-width: 1024px) 16vw, 50vw" className="transition-transform duration-700 group-hover:scale-105" />
                <InstaOverlay caption={p.caption} />
              </a>
            ))}
      </div>
    </SectionShell>
  );
}

function InstaOverlay({ caption }: { caption?: string }) {
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sc-black/60 p-3 text-center text-xs text-sc-ivory opacity-0 transition-opacity group-hover:opacity-100">
      <Instagram className="size-5 text-sc-gold" />
      {caption && <span className="line-clamp-3">{caption}</span>}
    </span>
  );
}

export function LocationSection({ section, settings }: SectionProps) {
  const d = section.data;
  const g = settings.general;
  const query = str(d.mapQuery) || `${g.street}, ${g.city}, ${g.state} ${g.zip}`;
  const parking = arr<{ icon: string; title: string; description: string }>(d.parking);
  const nearby = arr<{ name: string; detail: string }>(d.nearby);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} className="mb-10" />
          <address className="reveal mb-10 border-l-2 border-sc-gold pl-5 not-italic">
            <p className="font-display text-2xl">{g.street}, {g.suite}</p>
            <p className="opacity-70">{g.city}, {g.state} {g.zip}</p>
            <a className="mt-3 inline-block text-xs font-semibold tracking-[0.2em] text-sc-gold uppercase underline-offset-4 hover:underline" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
          </address>
          <div className="grid gap-6 sm:grid-cols-2">
            {parking.map((p, i) => (
              <div key={i} className="reveal space-y-2">
                <DynamicIcon name={p.icon} className="size-5 text-sc-gold" />
                <h3 className="text-sm font-semibold tracking-[0.12em] uppercase">{p.title}</h3>
                <p className="text-sm leading-relaxed opacity-70">{p.description}</p>
              </div>
            ))}
          </div>
          {nearby.length > 0 && (
            <ul className="reveal mt-10 divide-y divide-current/10 border-y border-current/10">
              {nearby.map((n, i) => (
                <li key={i} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="font-medium">{n.name}</span>
                  <span className="text-right opacity-60">{n.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="reveal relative min-h-[420px] overflow-hidden border border-current/10 lg:min-h-full">
          <iframe
            title={`Map of ${g.siteName}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
            className={cn('absolute inset-0 size-full border-0', section.theme === 'dark' && 'contrast-[1.05] grayscale invert-[0.9]')}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </SectionShell>
  );
}

export function FaqSection({ section }: SectionProps) {
  const d = section.data;
  const items = arr<{ category: string; question: string; answer: string }>(d.items).filter((i) => i.question);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} className="lg:sticky lg:top-28 lg:self-start" />
        <FaqClient items={items} />
      </div>
    </SectionShell>
  );
}
