import { RichText } from '@/components/rich-text';
import { getMembers } from '@/lib/server/data';
import { arr, Eyebrow, Heading, media, SectionIntro, SectionShell, SiteMedia, str } from '../primitives';
import { DirectoryClient } from './directory-client';
import { TourBookingClient } from './tour-booking-client';
import { WaitlistForm } from './waitlist-client';
import type { SectionProps } from './types';

export function WaitlistSection({ section, settings }: SectionProps) {
  const d = section.data;
  const image = media(d.image);
  const perks = arr<string>(d.perks);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor || 'waitlist'}>
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="space-y-7">
          <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
          <Heading className="reveal">{str(d.heading)}</Heading>
          <RichText text={d.intro} className="reveal text-base leading-relaxed opacity-75 md:text-lg" />
          {perks.length > 0 && (
            <ul className="reveal space-y-4 border-t border-current/10 pt-7">
              {perks.map((p, i) => (
                <li key={p} className="flex gap-4">
                  <span className="font-display text-xl text-sc-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pt-1 text-sm leading-relaxed opacity-85">{p}</span>
                </li>
              ))}
            </ul>
          )}
          {image && (
            <div className="reveal relative hidden aspect-[4/3] overflow-hidden lg:block">
              <SiteMedia value={image} sizes="40vw" />
            </div>
          )}
        </div>
        <div className="reveal border border-sc-gold/30 bg-current/[0.02] p-6 sm:p-10">
          <WaitlistForm
            options={settings.forms}
            submitLabel={str(d.submitLabel)}
            successTitle={str(d.successTitle)}
            successMessage={str(d.successMessage)}
          />
        </div>
      </div>
    </SectionShell>
  );
}

export async function DirectorySection({ section, settings }: SectionProps) {
  const d = section.data;
  const members = await getMembers();
  return (
    <SectionShell theme={section.theme} anchor={section.anchor}>
      <SectionIntro eyebrow={str(d.eyebrow)} heading={str(d.heading)} intro={<RichText text={d.intro} />} />
      <DirectoryClient members={members} specialties={settings.directory.specialties} emptyMessage={str(d.emptyMessage)} />
    </SectionShell>
  );
}

export function TourBookingSection({ section, settings }: SectionProps) {
  const d = section.data;
  const image = media(d.image);
  const expectations = arr<string>(d.expectations);
  return (
    <SectionShell theme={section.theme} anchor={section.anchor || 'book'}>
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-7">
          <Eyebrow className="reveal">{str(d.eyebrow)}</Eyebrow>
          <Heading className="reveal">{str(d.heading)}</Heading>
          <RichText text={d.intro} className="reveal text-base leading-relaxed opacity-75" />
          {expectations.length > 0 && (
            <ul className="reveal space-y-3 border-t border-current/10 pt-6 text-sm">
              {expectations.map((e) => (
                <li key={e} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-sc-gold" /> {e}
                </li>
              ))}
            </ul>
          )}
          {image && (
            <div className="reveal relative hidden aspect-[4/3] overflow-hidden lg:block">
              <SiteMedia value={image} sizes="35vw" />
            </div>
          )}
        </div>
        <div className="reveal border border-sc-gold/30 p-6 sm:p-10">
          <TourBookingClient
            specialties={settings.forms.specialties}
            durationMinutes={settings.booking.durationMinutes}
            successTitle={str(d.successTitle)}
            successMessage={str(d.successMessage)}
          />
        </div>
      </div>
    </SectionShell>
  );
}
