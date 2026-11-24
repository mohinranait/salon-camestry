import type { LinkValue, MediaRef, NavItem, Phase, PhaseRule } from './types';

export type EmailTemplate = { enabled: boolean; subject: string; body: string };

export type WeeklySlots = { day: number; times: string[] }[];

export type SiteSettings = {
  general: {
    siteName: string;
    tagline: string;
    logo: MediaRef | null;
    logoLight: MediaRef | null;
    favicon: MediaRef | null;
    email: string;
    phone: string;
    street: string;
    suite: string;
    city: string;
    state: string;
    zip: string;
    hours: string;
    footerText: string;
  };
  phase: {
    current: Phase;
    openingLabel: string;
    phase1Cta: LinkValue;
    phase2Cta: LinkValue;
  };
  announcement: {
    enabled: boolean;
    /** Phase 1 (pre-launch) message. */
    text: string;
    linkLabel: string;
    linkHref: string;
    /** Phase 2 (launch) message; empty hides the bar after launch. */
    phase2Text: string;
    phase2LinkLabel: string;
    phase2LinkHref: string;
  };
  navigation: {
    header: NavItem[];
    footer: NavItem[];
  };
  social: {
    instagramHandle: string;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
  };
  instagram: {
    accessToken: string;
  };
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string;
    ogImage: MediaRef | null;
    googleVerification: string;
    latitude: string;
    longitude: string;
    priceRange: string;
  };
  brand: {
    gold: string;
    goldLight: string;
    black: string;
    ivory: string;
    charcoal: string;
  };
  emails: {
    fromName: string;
    fromEmail: string;
    notifyEmail: string;
    waitlistWelcome: EmailTemplate;
    leadAlert: { enabled: boolean };
    tourConfirmation: EmailTemplate;
    /** Sent when an admin marks a tour Confirmed. */
    tourConfirmed: EmailTemplate;
    /** Sent when an admin marks a tour Cancelled. */
    tourCancelled: EmailTemplate;
    bookingAlert: { enabled: boolean };
  };
  booking: {
    durationMinutes: number;
    minNoticeHours: number;
    maxDaysAhead: number;
    weekly: WeeklySlots;
    blackoutDates: string[];
  };
  forms: {
    specialties: string[];
    suiteSizes: string[];
    suiteTypes: string[];
    moveInOptions: string[];
  };
  directory: {
    specialties: string[];
  };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: 'Shear Chemistry Salon Suites',
    tagline: 'Where artistry meets business chemistry.',
    logo: null,
    logoLight: null,
    favicon: null,
    email: 'hello@shearchemistrysuites.com',
    phone: '(404) 555-0134',
    street: '1341 Moreland Avenue',
    suite: 'Suite 201',
    city: 'Atlanta',
    state: 'GA',
    zip: '30316',
    hours: 'Pros: 24/7 smart-lock access · Tours by appointment',
    footerText:
      'An upscale, 20-suite turnkey studio for independent beauty and wellness professionals in Southeast Atlanta.',
  },
  phase: {
    current: 'phase1',
    openingLabel: 'May 2027',
    phase1Cta: { label: 'Join VIP Waitlist', href: '/founding-members#waitlist' },
    phase2Cta: { label: 'Book a Tour', href: '/book-a-tour' },
  },
  announcement: {
    enabled: true,
    text: 'Coming May 2027 to Moreland Ave • Now Accepting Founding Member Inquiries',
    linkLabel: 'Join the list',
    linkHref: '/founding-members#waitlist',
    phase2Text: 'Now Open on Moreland Ave • Private Suite Tours Available',
    phase2LinkLabel: 'Book a tour',
    phase2LinkHref: '/book-a-tour',
  },
  navigation: {
    header: [
      { label: 'Home', href: '/', phase: 'all' },
      { label: 'The Suites', href: '/suites', phase: 'all' },
      { label: 'The Build-Out', href: '/build-out', phase: 'all' },
      { label: 'Founding Members', href: '/founding-members', phase: 'all' },
      { label: 'Find a Beauty Pro', href: '/find-a-pro', phase: 'phase2' },
    ],
    footer: [
      { label: 'The Suites', href: '/suites', phase: 'all' },
      { label: 'The Build-Out', href: '/build-out', phase: 'all' },
      { label: 'Founding Members & FAQ', href: '/founding-members', phase: 'all' },
      { label: 'Find a Beauty Pro', href: '/find-a-pro', phase: 'phase2' },
      { label: 'Book a Tour', href: '/book-a-tour', phase: 'phase2' },
    ],
  },
  social: {
    instagramHandle: 'shearchemistrysuites',
    instagramUrl: 'https://instagram.com/shearchemistrysuites',
    facebookUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
  },
  instagram: { accessToken: '' },
  seo: {
    titleTemplate: '%s | Shear Chemistry',
    defaultTitle: 'Luxury Salon Suites in Southeast Atlanta | Shear Chemistry',
    defaultDescription:
      'Upscale turnkey salon suites for rent on Moreland Ave in Southeast Atlanta. 20 private wet & dry suites, 24/7 access, wash & dry lounge. Opening May 2027.',
    keywords:
      'salon suites Atlanta, salon suites for rent Atlanta, Southeast Atlanta salon suites, Moreland Avenue salon, beauty suites East Atlanta, salon studio rental',
    ogImage: null,
    googleVerification: '',
    latitude: '33.7365',
    longitude: '-84.3497',
    priceRange: '$$',
  },
  brand: {
    gold: '#C6A15B',
    goldLight: '#E4CC94',
    black: '#0D0D0D',
    ivory: '#FAF7F1',
    charcoal: '#2A2A2A',
  },
  emails: {
    fromName: 'Shear Chemistry Salon Suites',
    fromEmail: 'hello@shearchemistrysuites.com',
    notifyEmail: 'owner@shearchemistrysuites.com',
    waitlistWelcome: {
      enabled: true,
      subject: 'Welcome to the Founding Member VIP List, {{firstName}}',
      body: `Hi {{firstName}},

Thank you for joining the Shear Chemistry Founding Member VIP Waitlist. You're officially on the list for our {{suitePreference}} suites.

What happens next:
• You'll get build-out updates and first look at the finished suites.
• Founding Members receive priority suite selection before public leasing opens.
• We'll reach out personally to schedule your private tour once walkthroughs are safe in Spring 2027.

Follow the build on Instagram: @shearchemistrysuites

With chemistry,
The Shear Chemistry Team
1341 Moreland Avenue, Suite 201, Atlanta, GA 30316`,
    },
    leadAlert: { enabled: true },
    tourConfirmation: {
      enabled: true,
      subject: 'Your private tour is requested for {{date}} at {{time}}',
      body: `Hi {{firstName}},

Thanks for requesting a private tour of Shear Chemistry Salon Suites on {{date}} at {{time}}.

We'll confirm your appointment shortly. The studio is at 1341 Moreland Avenue, Suite 201, Atlanta, GA 30316, with free on-site parking.

See you soon,
The Shear Chemistry Team`,
    },
    tourConfirmed: {
      enabled: true,
      subject: 'Confirmed: your Shear Chemistry tour on {{date}} at {{time}}',
      body: `Hi {{firstName}},

Your private tour is confirmed for {{date}} at {{time}}. We can't wait to show you around.

Where: 1341 Moreland Avenue, Suite 201, Atlanta, GA 30316 (next to Halidom Eatery). Free on-site parking is right outside.

Bring your questions and your vision. If your plans change, just reply to this email.

See you soon,
The Shear Chemistry Team`,
    },
    tourCancelled: {
      enabled: true,
      subject: 'Your Shear Chemistry tour on {{date}} was cancelled',
      body: `Hi {{firstName}},

Your private tour on {{date}} at {{time}} has been cancelled. We're sorry for any inconvenience.

You can choose a new time anytime at {{bookingUrl}}, or reply to this email and we'll find one together.

The Shear Chemistry Team`,
    },
    bookingAlert: { enabled: true },
  },
  booking: {
    durationMinutes: 30,
    minNoticeHours: 24,
    maxDaysAhead: 45,
    weekly: [
      { day: 0, times: [] },
      { day: 1, times: ['10:00', '11:00', '14:00', '15:00'] },
      { day: 2, times: ['10:00', '11:00', '14:00', '15:00'] },
      { day: 3, times: ['10:00', '11:00', '14:00', '15:00', '17:30'] },
      { day: 4, times: ['10:00', '11:00', '14:00', '15:00'] },
      { day: 5, times: ['10:00', '11:00', '13:00'] },
      { day: 6, times: ['11:00', '12:00'] },
    ],
    blackoutDates: [],
  },
  forms: {
    specialties: [
      'Hair Stylist',
      'Colorist',
      'Barber',
      'Lash Artist',
      'Esthetician',
      'Nail Technician',
      'Brow Artist',
      'Makeup Artist',
      'Massage / Wellness',
      'Other',
    ],
    suiteSizes: ['Single', 'Double', 'Not sure yet'],
    suiteTypes: ['Wet (with shampoo bowl)', 'Dry', 'Not sure yet'],
    moveInOptions: ['May 2027 (Grand Opening)', 'Summer 2027', 'Fall 2027', 'Just exploring'],
  },
  directory: {
    specialties: ['Hair', 'Lashes', 'Esthetics', 'Nails', 'Barbering', 'Wellness'],
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merges stored settings over the defaults so newly added keys always exist. */
export function mergeSettings<T>(defaults: T, stored: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) {
    return (stored === undefined ? defaults : stored) as T;
  }
  const out: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    const base = (defaults as Record<string, unknown>)[key];
    out[key] = isPlainObject(base) && base !== null ? mergeSettings(base, value) : value;
  }
  return out as T;
}

export function isPhaseVisible(rule: PhaseRule | undefined, phase: Phase) {
  return !rule || rule === 'all' || rule === phase;
}

/** The announcement bar for the current phase, or null when it is hidden. */
export function currentAnnouncement(settings: SiteSettings) {
  const a = settings.announcement;
  if (!a.enabled) return null;
  const launch = settings.phase.current === 'phase2';
  const text = launch ? a.phase2Text : a.text;
  if (!text) return null;
  return { text, linkLabel: launch ? a.phase2LinkLabel : a.linkLabel, linkHref: launch ? a.phase2LinkHref : a.linkHref };
}

export function primaryCta(settings: SiteSettings): LinkValue {
  return settings.phase.current === 'phase2' ? settings.phase.phase2Cta : settings.phase.phase1Cta;
}
