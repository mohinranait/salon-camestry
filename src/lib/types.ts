// Shared types used by both the admin panel and the public site.

export type MediaKind = 'image' | 'video' | 'document';

/** A placement of a media library item. `alt` belongs to the placement, not the file. */
export type MediaRef = { mediaId: string; alt: string };

export type MediaInfo = {
  id: string;
  url: string;
  kind: MediaKind;
  mimeType: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  title: string;
};

/** A MediaRef after the server attached the file details. */
export type ResolvedMediaRef = MediaRef & { media?: MediaInfo };

export type MediaItem = MediaInfo & {
  filename: string;
  originalName: string;
  size: number;
  defaultAlt: string;
  tags: string[];
  createdAt: string;
};

export type Phase = 'phase1' | 'phase2';
/** Which launch phase something is shown in. */
export type PhaseRule = 'all' | 'phase1' | 'phase2';

export type LinkValue = { label: string; href: string };

export type NavItem = { label: string; href: string; phase: PhaseRule };

export type SectionTheme = 'light' | 'ivory' | 'dark';

export type SectionInstance = {
  id: string;
  type: string;
  enabled: boolean;
  phase: PhaseRule;
  anchor: string;
  theme: SectionTheme;
  data: Record<string, unknown>;
};

export type PageStatus = 'published' | 'draft';

export type PageDoc = {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  availability: PhaseRule;
  sections: SectionInstance[];
  seoTitle: string;
  seoDescription: string;
  ogImage: ResolvedMediaRef | null;
  noIndex: boolean;
  order: number;
  updatedAt: string;
};

export type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming';

export type MilestoneDoc = {
  id: string;
  title: string;
  dateLabel: string;
  status: MilestoneStatus;
  caption: string;
  gallery: ResolvedMediaRef[];
  order: number;
};

export type SuiteDoc = {
  id: string;
  name: string;
  size: string;
  wetDry: string;
  count: number;
  available: number;
  sqft: string;
  priceLabel: string;
  summary: string;
  description: string;
  features: string[];
  image: ResolvedMediaRef | null;
  gallery: ResolvedMediaRef[];
  published: boolean;
  order: number;
};

export type MemberDoc = {
  id: string;
  name: string;
  businessName: string;
  suiteNumber: string;
  specialty: string;
  headshot: ResolvedMediaRef | null;
  bio: string;
  instagram: string;
  bookingUrl: string;
  published: boolean;
  featured: boolean;
  order: number;
};

export type LeadStatus = 'new' | 'contacted' | 'toured' | 'signed' | 'archived';

export type LeadDoc = {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  suiteSize: string;
  suiteType: string;
  moveIn: string;
  message: string;
  status: LeadStatus;
  notes: string;
  emailStatus: string;
  createdAt: string;
};

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type BookingDoc = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
  emailStatus: string;
  createdAt: string;
};
