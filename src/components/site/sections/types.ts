import type { SiteSettings } from '@/lib/settings';
import type { SectionInstance } from '@/lib/types';

export type SectionProps = {
  section: SectionInstance;
  settings: SiteSettings;
  /** Position on the page; the first section loads its media with priority. */
  index: number;
};
