import type { ComponentType } from 'react';
import { isPhaseVisible, type SiteSettings } from '@/lib/settings';
import type { SectionInstance } from '@/lib/types';
import {
  CtaBannerSection, FormulaSection, GallerySection, HeroSection, PageHeaderSection, RichTextSection, SplitContentSection,
  StatsSection,
} from './sections/basic';
import { BuildGallerySection, BuildTeaserSection, MilestonesSection } from './sections/build';
import { FaqSection, FloorPlanSection, InstagramSection, LocationSection, SuiteTypesSection } from './sections/content';
import { DirectorySection, TourBookingSection, WaitlistSection } from './sections/forms';
import type { SectionProps } from './sections/types';

const COMPONENTS: Record<string, ComponentType<SectionProps>> = {
  hero: HeroSection,
  pageHeader: PageHeaderSection,
  stats: StatsSection,
  formula: FormulaSection,
  splitContent: SplitContentSection,
  buildTeaser: BuildTeaserSection,
  instagram: InstagramSection,
  suiteTypes: SuiteTypesSection,
  floorPlan: FloorPlanSection,
  milestones: MilestonesSection,
  buildGallery: BuildGallerySection,
  gallery: GallerySection,
  waitlistForm: WaitlistSection,
  location: LocationSection,
  faq: FaqSection,
  ctaBanner: CtaBannerSection,
  directory: DirectorySection,
  tourBooking: TourBookingSection,
  richText: RichTextSection,
};

export function visibleSections(sections: SectionInstance[], settings: SiteSettings) {
  return sections.filter((s) => s.enabled && isPhaseVisible(s.phase, settings.phase.current) && COMPONENTS[s.type]);
}

export function SectionRenderer({ sections, settings }: { sections: SectionInstance[]; settings: SiteSettings }) {
  return (
    <>
      {sections.map((section, index) => {
        const Cmp = COMPONENTS[section.type];
        return <Cmp key={section.id} section={section} settings={settings} index={index} />;
      })}
    </>
  );
}
