import type { Metadata } from 'next';
import { RevealObserver, StickyCta } from '@/components/site/chrome';
import { SiteFooter } from '@/components/site/footer';
import { SmartLink } from '@/components/site/primitives';
import { getSettings } from '@/lib/server/data';
import { isPhaseVisible, primaryCta } from '@/lib/settings';
import type { ResolvedMediaRef } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const favicon = (settings.general.favicon as ResolvedMediaRef | null)?.media?.url;
  return {
    title: { default: settings.seo.defaultTitle, template: settings.seo.titleTemplate },
    description: settings.seo.defaultDescription,
    applicationName: settings.general.siteName,
    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
    verification: settings.seo.googleVerification ? { google: settings.seo.googleVerification } : undefined,
    formatDetection: { telephone: true, address: true, email: true },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const { brand, announcement } = settings;
  const showBanner = announcement.enabled && announcement.text && isPhaseVisible(announcement.phase, settings.phase.current);
  const css = `:root{--sc-gold:${brand.gold};--sc-gold-light:${brand.goldLight};--sc-black:${brand.black};--sc-ivory:${brand.ivory};--sc-charcoal:${brand.charcoal};}`;

  return (
    <div className="flex min-h-screen flex-col bg-sc-black font-sans text-sc-charcoal">
      <style dangerouslySetInnerHTML={{ __html: css.replace(/[<>]/g, '') }} />
      <a href="#main" className="sr-only z-[70] bg-sc-gold px-4 py-2 text-sc-black focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      {showBanner && (
        <div className="relative z-50 bg-sc-black text-center text-[11px] font-semibold tracking-[0.18em] text-sc-gold uppercase sm:text-xs">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span>{announcement.text}</span>
            {announcement.linkLabel && announcement.linkHref && (
              <SmartLink href={announcement.linkHref} className="text-sc-ivory underline underline-offset-4 hover:text-sc-gold-light">
                {announcement.linkLabel} →
              </SmartLink>
            )}
          </div>
          <div className="gold-rule opacity-50" />
        </div>
      )}
      {children}
      <SiteFooter settings={settings} />
      <StickyCta cta={primaryCta(settings)} />
      <RevealObserver />
    </div>
  );
}
