import type { Field } from './fields';

const phaseOptions = [
  { value: 'all', label: 'Both phases' },
  { value: 'phase1', label: 'Phase 1 only' },
  { value: 'phase2', label: 'Phase 2 only' },
];

const navFields: Field[] = [
  { type: 'text', name: 'label', label: 'Label' },
  { type: 'text', name: 'href', label: 'Link', placeholder: '/suites' },
  { type: 'select', name: 'phase', label: 'Show in', options: phaseOptions },
];

export type SettingsGroup = { title: string; description?: string; path: string[]; fields: Field[] };
export type SettingsTab = { value: string; label: string; groups: SettingsGroup[] };

export const SETTINGS_TABS: SettingsTab[] = [
  {
    value: 'general',
    label: 'General',
    groups: [
      {
        title: 'Brand & contact',
        path: ['general'],
        fields: [
          { type: 'text', name: 'siteName', label: 'Site name' },
          { type: 'text', name: 'tagline', label: 'Tagline' },
          { type: 'image', name: 'logo', label: 'Logo (for light backgrounds)', help: 'Leave empty to use the typeset wordmark' },
          { type: 'image', name: 'logoLight', label: 'Logo (for dark backgrounds)' },
          { type: 'image', name: 'favicon', label: 'Browser tab icon', help: 'Square PNG, at least 512×512' },
          { type: 'text', name: 'email', label: 'Public email' },
          { type: 'text', name: 'phone', label: 'Phone' },
          { type: 'text', name: 'street', label: 'Street address' },
          { type: 'text', name: 'suite', label: 'Suite / unit' },
          { type: 'text', name: 'city', label: 'City' },
          { type: 'text', name: 'state', label: 'State' },
          { type: 'text', name: 'zip', label: 'ZIP' },
          { type: 'text', name: 'hours', label: 'Hours line' },
          { type: 'textarea', name: 'footerText', label: 'Footer blurb', rows: 3 },
        ],
      },
    ],
  },
  {
    value: 'launch',
    label: 'Launch & banner',
    groups: [
      {
        title: 'Launch phase',
        description: 'Phase 1 collects VIP waitlist leads. Phase 2 unhides the member directory and tour booking and switches every primary button to "Book a Tour".',
        path: ['phase'],
        fields: [
          { type: 'select', name: 'current', label: 'Current phase', options: [{ value: 'phase1', label: 'Phase 1 · Pre-launch (VIP waitlist)' }, { value: 'phase2', label: 'Phase 2 · Launch (tours & directory)' }] },
          { type: 'text', name: 'openingLabel', label: 'Opening date label', placeholder: 'May 2027' },
          { type: 'link', name: 'phase1Cta', label: 'Phase 1 primary button', help: 'Sticky mobile button and every "site-wide CTA"' },
          { type: 'link', name: 'phase2Cta', label: 'Phase 2 primary button' },
        ],
      },
      {
        title: 'Announcement bar',
        path: ['announcement'],
        fields: [
          { type: 'boolean', name: 'enabled', label: 'Show the announcement bar' },
          { type: 'text', name: 'text', label: 'Phase 1 text (pre-launch)' },
          { type: 'text', name: 'linkLabel', label: 'Phase 1 link text' },
          { type: 'text', name: 'linkHref', label: 'Phase 1 link' },
          { type: 'text', name: 'phase2Text', label: 'Phase 2 text (after launch)', help: 'Leave empty to hide the bar after launch' },
          { type: 'text', name: 'phase2LinkLabel', label: 'Phase 2 link text' },
          { type: 'text', name: 'phase2LinkHref', label: 'Phase 2 link' },
        ],
      },
    ],
  },
  {
    value: 'navigation',
    label: 'Navigation',
    groups: [
      {
        title: 'Menus',
        path: ['navigation'],
        fields: [
          { type: 'list', name: 'header', label: 'Header menu', itemLabel: 'Link', titleField: 'label', fields: navFields },
          { type: 'list', name: 'footer', label: 'Footer menu', itemLabel: 'Link', titleField: 'label', fields: navFields },
        ],
      },
    ],
  },
  {
    value: 'social',
    label: 'Social & Instagram',
    groups: [
      {
        title: 'Social profiles',
        path: ['social'],
        fields: [
          { type: 'text', name: 'instagramHandle', label: 'Instagram handle', placeholder: 'shearchemistrysuites' },
          { type: 'text', name: 'instagramUrl', label: 'Instagram URL' },
          { type: 'text', name: 'facebookUrl', label: 'Facebook URL' },
          { type: 'text', name: 'tiktokUrl', label: 'TikTok URL' },
          { type: 'text', name: 'youtubeUrl', label: 'YouTube URL' },
        ],
      },
      {
        title: 'Live Instagram feed',
        description: 'Paste a long-lived Instagram API access token (Instagram API with Instagram Login) to show your latest posts. Without it, the feed section shows the fallback posts you choose.',
        path: ['instagram'],
        fields: [{ type: 'text', name: 'accessToken', label: 'Access token', placeholder: 'IGAA…' }],
      },
    ],
  },
  {
    value: 'seo',
    label: 'SEO',
    groups: [
      {
        title: 'Search defaults',
        description: 'Used when a page has no SEO title or description of its own. Local business details power the Google map listing data (schema.org).',
        path: ['seo'],
        fields: [
          { type: 'text', name: 'titleTemplate', label: 'Title template', help: '%s is replaced by the page title' },
          { type: 'text', name: 'defaultTitle', label: 'Default title' },
          { type: 'textarea', name: 'defaultDescription', label: 'Default description', rows: 3 },
          { type: 'textarea', name: 'keywords', label: 'Keywords', rows: 2 },
          { type: 'image', name: 'ogImage', label: 'Default social share image', help: '1200×630 works best' },
          { type: 'text', name: 'googleVerification', label: 'Google Search Console verification code' },
          { type: 'text', name: 'latitude', label: 'Latitude' },
          { type: 'text', name: 'longitude', label: 'Longitude' },
          { type: 'text', name: 'priceRange', label: 'Price range', placeholder: '$$' },
        ],
      },
    ],
  },
  {
    value: 'brand',
    label: 'Colors',
    groups: [
      {
        title: 'Brand colors',
        description: 'Applied across the whole public site.',
        path: ['brand'],
        fields: [
          { type: 'color', name: 'gold', label: 'Signature gold' },
          { type: 'color', name: 'goldLight', label: 'Light gold' },
          { type: 'color', name: 'black', label: 'Black' },
          { type: 'color', name: 'ivory', label: 'Ivory / off-white' },
          { type: 'color', name: 'charcoal', label: 'Charcoal text' },
        ],
      },
    ],
  },
  {
    value: 'emails',
    label: 'Emails',
    groups: [
      {
        title: 'Notifications',
        description: 'The email server and sender address are set in Admin → Email. Here you choose who receives alerts and what each automatic email says.',
        path: ['emails'],
        fields: [
          { type: 'text', name: 'notifyEmail', label: 'Owner notification email', help: 'New leads and tour requests are sent here, and guests’ replies go to it' },
        ],
      },
      {
        title: 'VIP waitlist welcome email',
        description: 'Variables: {{firstName}} {{name}} {{specialty}} {{suitePreference}} {{suiteSize}} {{suiteType}} {{moveIn}}',
        path: ['emails', 'waitlistWelcome'],
        fields: [
          { type: 'boolean', name: 'enabled', label: 'Send automatically' },
          { type: 'text', name: 'subject', label: 'Subject' },
          { type: 'textarea', name: 'body', label: 'Message', rows: 12 },
        ],
      },
      { title: 'New lead alert', path: ['emails', 'leadAlert'], fields: [{ type: 'boolean', name: 'enabled', label: 'Email the owner about each new lead' }] },
      {
        title: 'Tour request confirmation',
        description: 'Variables: {{firstName}} {{name}} {{date}} {{time}}',
        path: ['emails', 'tourConfirmation'],
        fields: [
          { type: 'boolean', name: 'enabled', label: 'Send automatically' },
          { type: 'text', name: 'subject', label: 'Subject' },
          { type: 'textarea', name: 'body', label: 'Message', rows: 10 },
        ],
      },
      {
        title: 'Tour confirmed',
        description: 'Sent when you mark a tour Confirmed in Tour bookings. Variables: {{firstName}} {{name}} {{date}} {{time}}',
        path: ['emails', 'tourConfirmed'],
        fields: [
          { type: 'boolean', name: 'enabled', label: 'Send automatically' },
          { type: 'text', name: 'subject', label: 'Subject' },
          { type: 'textarea', name: 'body', label: 'Message', rows: 9 },
        ],
      },
      {
        title: 'Tour cancelled',
        description: 'Sent when you mark a tour Cancelled. Variables: {{firstName}} {{name}} {{date}} {{time}} {{bookingUrl}}',
        path: ['emails', 'tourCancelled'],
        fields: [
          { type: 'boolean', name: 'enabled', label: 'Send automatically' },
          { type: 'text', name: 'subject', label: 'Subject' },
          { type: 'textarea', name: 'body', label: 'Message', rows: 8 },
        ],
      },
      { title: 'New booking alert', path: ['emails', 'bookingAlert'], fields: [{ type: 'boolean', name: 'enabled', label: 'Email the owner about each tour request' }] },
    ],
  },
  {
    value: 'booking',
    label: 'Tour booking',
    groups: [
      {
        title: 'Booking rules',
        path: ['booking'],
        fields: [
          { type: 'number', name: 'durationMinutes', label: 'Tour length (minutes)', min: 10, step: 5 },
          { type: 'number', name: 'minNoticeHours', label: 'Minimum notice (hours)', min: 0 },
          { type: 'number', name: 'maxDaysAhead', label: 'Bookable days ahead', min: 1 },
          { type: 'stringList', name: 'blackoutDates', label: 'Closed dates', help: 'One date per line as YYYY-MM-DD' },
        ],
      },
    ],
  },
  {
    value: 'forms',
    label: 'Form options',
    groups: [
      {
        title: 'Founding Member form choices',
        path: ['forms'],
        fields: [
          { type: 'stringList', name: 'specialties', label: 'Specialty / license types' },
          { type: 'stringList', name: 'suiteSizes', label: 'Suite sizes' },
          { type: 'stringList', name: 'suiteTypes', label: 'Wet / dry options' },
          { type: 'stringList', name: 'moveInOptions', label: 'Target move-in options' },
        ],
      },
      {
        title: 'Directory filters',
        path: ['directory'],
        fields: [{ type: 'stringList', name: 'specialties', label: 'Specialty categories', help: 'Filter buttons on “Find a Beauty Pro”' }],
      },
    ],
  },
];
