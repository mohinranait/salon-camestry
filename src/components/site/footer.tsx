import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Facebook, Instagram, Youtube } from '@/components/brand-icons';
import { isPhaseVisible, primaryCta, type SiteSettings } from '@/lib/settings';
import { ButtonLink } from './primitives';
import { Wordmark } from './chrome';

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const g = settings.general;
  const phase = settings.phase.current;
  const links = settings.navigation.footer.filter((n) => isPhaseVisible(n.phase, phase));
  const social = [
    { href: settings.social.instagramUrl, label: 'Instagram', icon: Instagram },
    { href: settings.social.facebookUrl, label: 'Facebook', icon: Facebook },
    { href: settings.social.youtubeUrl, label: 'YouTube', icon: Youtube },
  ].filter((s) => s.href);
  const address = `${g.street}, ${g.suite}, ${g.city}, ${g.state} ${g.zip}`;

  return (
    <footer className="bg-sc-black pb-28 text-sc-ivory md:pb-0">
      <div className="gold-rule" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div className="space-y-6">
          <Wordmark name={g.siteName} />
          <p className="max-w-sm text-sm leading-relaxed text-sc-ivory/60">{g.footerText}</p>
          <ButtonLink link={primaryCta(settings)} />
        </div>
        <div>
          <h2 className="mb-5 text-[11px] font-semibold tracking-[0.3em] text-sc-gold uppercase">Explore</h2>
          <ul className="space-y-3 text-sm">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-sc-ivory/75 transition-colors hover:text-sc-gold">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] font-semibold tracking-[0.3em] text-sc-gold uppercase">Visit</h2>
          <address className="space-y-3 text-sm text-sc-ivory/75 not-italic">
            <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-sc-gold">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sc-gold" />
              <span>{g.street}, {g.suite}<br />{g.city}, {g.state} {g.zip}</span>
            </a>
            {g.phone && (
              <a href={`tel:${g.phone.replace(/[^\d+]/g, '')}`} className="flex gap-3 hover:text-sc-gold">
                <Phone className="mt-0.5 size-4 shrink-0 text-sc-gold" /> {g.phone}
              </a>
            )}
            {g.email && (
              <a href={`mailto:${g.email}`} className="flex gap-3 break-all hover:text-sc-gold">
                <Mail className="mt-0.5 size-4 shrink-0 text-sc-gold" /> {g.email}
              </a>
            )}
            <p className="text-xs text-sc-ivory/50">{g.hours}</p>
          </address>
          {social.length > 0 && (
            <div className="mt-6 flex gap-2">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex size-10 items-center justify-center rounded-full border border-sc-ivory/20 transition-colors hover:border-sc-gold hover:text-sc-gold">
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-sc-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-sc-ivory/45 sm:flex-row sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {g.siteName}. All rights reserved.</p>
          <p>Salon suites for rent in Southeast Atlanta · Moreland Avenue</p>
        </div>
      </div>
    </footer>
  );
}
