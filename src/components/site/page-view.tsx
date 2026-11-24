import { isPhaseVisible, primaryCta, type SiteSettings } from '@/lib/settings';
import type { PageDoc, ResolvedMediaRef } from '@/lib/types';
import { faqJsonLd, localBusinessJsonLd } from '@/lib/server/seo';
import { SiteHeader } from './chrome';
import { SectionRenderer, visibleSections } from './section-renderer';

function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function PageView({ page, settings, preview = false }: { page: PageDoc; settings: SiteSettings; preview?: boolean }) {
  const sections = visibleSections(page.sections, settings);
  const first = sections[0];
  const overlay = Boolean(first && ['hero', 'pageHeader', 'ctaBanner'].includes(first.type) && first.theme === 'dark');
  const nav = settings.navigation.header.filter((n) => isPhaseVisible(n.phase, settings.phase.current));

  return (
    <>
      {preview && (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-black">
          Preview: this page is {page.status === 'draft' ? 'a draft' : 'not available in the current phase'} and hidden from visitors.
        </div>
      )}
      <SiteHeader
        name={settings.general.siteName}
        logo={settings.general.logo as ResolvedMediaRef | null}
        logoLight={settings.general.logoLight as ResolvedMediaRef | null}
        nav={nav}
        cta={primaryCta(settings)}
        overlay={overlay}
      />
      <main id="main" className="flex-1">
        {/* Every page needs one h1; hero and page header sections provide it, otherwise the page title does. */}
        {!(first && ['hero', 'pageHeader'].includes(first.type)) && <h1 className="sr-only">{page.title}</h1>}
        <SectionRenderer sections={sections} settings={settings} />
      </main>
      {page.slug === 'home' && <JsonLd data={localBusinessJsonLd(settings)} />}
      <JsonLd data={faqJsonLd(page.sections, settings)} />
    </>
  );
}
