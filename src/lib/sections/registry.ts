import { emptyItem, type Field } from '../fields';

export type SectionDefinition = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
};

const eyebrow: Field = { type: 'text', name: 'eyebrow', label: 'Eyebrow', help: 'Small label above the heading' };
const heading: Field = { type: 'text', name: 'heading', label: 'Heading' };
const intro: Field = { type: 'richtext', name: 'intro', label: 'Intro text', rows: 3 };

const ctaFields: Field[] = [
  {
    type: 'boolean',
    name: 'useSiteCta',
    label: 'Use the site-wide primary CTA',
    help: 'Follows the launch phase: "Join VIP Waitlist" in Phase 1, "Book a Tour" in Phase 2.',
  },
  { type: 'link', name: 'cta', label: 'Custom button', help: 'Used when the site-wide CTA is off' },
  {
    type: 'link',
    name: 'phase2Cta',
    label: 'Custom button after launch (optional)',
    help: 'Shown in Phase 2 instead of the custom button. If empty, a custom button that links to the waitlist switches to the site-wide "Book a Tour" button.',
  },
];

export const SECTIONS: SectionDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Full-width opening banner with image or video background and CTAs.',
    fields: [
      eyebrow,
      { type: 'textarea', name: 'heading', label: 'Heading', rows: 2 },
      { type: 'text', name: 'highlight', label: 'Gold highlight words', help: 'Words in the heading to set in gold italic' },
      { type: 'richtext', name: 'subheading', label: 'Value proposition', rows: 3 },
      { type: 'image', name: 'background', label: 'Background image or video', accept: 'any' },
      { type: 'number', name: 'overlay', label: 'Dark overlay (%)', min: 0, max: 90, step: 5 },
      { type: 'select', name: 'height', label: 'Height', options: [
        { value: 'full', label: 'Full screen' },
        { value: 'large', label: 'Large' },
        { value: 'medium', label: 'Medium' },
      ] },
      ...ctaFields,
      { type: 'link', name: 'secondaryCta', label: 'Secondary link' },
      { type: 'stringList', name: 'badges', label: 'Badges under the buttons', help: 'One per line, e.g. "20 Turnkey Suites"' },
    ],
  },
  {
    type: 'pageHeader',
    label: 'Page header',
    description: 'Compact title banner for inner pages.',
    fields: [eyebrow, heading, intro, { type: 'image', name: 'background', label: 'Background image', accept: 'image' }],
  },
  {
    type: 'stats',
    label: 'Key numbers',
    description: 'A row of big numbers, e.g. square footage and suite count.',
    fields: [
      { type: 'list', name: 'items', label: 'Numbers', itemLabel: 'Number', titleField: 'label', fields: [
        { type: 'text', name: 'value', label: 'Value', placeholder: '3,813' },
        { type: 'text', name: 'suffix', label: 'Suffix', placeholder: 'sq ft' },
        { type: 'text', name: 'label', label: 'Label' },
      ] },
    ],
  },
  {
    type: 'formula',
    label: 'The Formula (amenities)',
    description: 'Periodic-table style grid of facility perks.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'list', name: 'items', label: 'Elements', itemLabel: 'Element', titleField: 'title', fields: [
        { type: 'text', name: 'symbol', label: 'Element symbol', placeholder: 'Ak', help: 'Two letters shown like a periodic table tile' },
        { type: 'icon', name: 'icon', label: 'Icon' },
        { type: 'text', name: 'title', label: 'Title' },
        { type: 'textarea', name: 'description', label: 'Description', rows: 2 },
      ] },
      { type: 'image', name: 'image', label: 'Feature image (optional)', accept: 'image' },
    ],
  },
  {
    type: 'splitContent',
    label: 'Text + image',
    description: 'Editorial block with text on one side and media on the other.',
    fields: [
      eyebrow,
      heading,
      { type: 'richtext', name: 'body', label: 'Body', rows: 6 },
      { type: 'image', name: 'image', label: 'Image or video', accept: 'any' },
      { type: 'select', name: 'imagePosition', label: 'Image position', options: [
        { value: 'right', label: 'Right' },
        { value: 'left', label: 'Left' },
      ] },
      { type: 'stringList', name: 'bullets', label: 'Bullet points' },
      ...ctaFields,
    ],
  },
  {
    type: 'buildTeaser',
    label: 'Build-out teaser',
    description: 'Construction progress gauge with the latest milestone and photos.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'image', name: 'image', label: 'Feature image', accept: 'any' },
      { type: 'link', name: 'cta', label: 'Button' },
    ],
  },
  {
    type: 'instagram',
    label: 'Instagram feed',
    description: 'Live feed when an access token is set in Settings, otherwise the posts below.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'number', name: 'limit', label: 'Posts to show', min: 3, max: 12 },
      { type: 'list', name: 'posts', label: 'Fallback posts', itemLabel: 'Post', titleField: 'caption', fields: [
        { type: 'image', name: 'image', label: 'Image', accept: 'image' },
        { type: 'text', name: 'caption', label: 'Caption' },
        { type: 'text', name: 'href', label: 'Post link' },
      ] },
    ],
  },
  {
    type: 'suiteTypes',
    label: 'Suite configurations',
    description: 'Cards for each suite type from the Suites collection.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'stringList', name: 'included', label: 'Included in every suite', help: 'One per line' },
      ...ctaFields,
    ],
  },
  {
    type: 'floorPlan',
    label: 'Floor plan',
    description: 'Architectural floor plan with clickable callouts.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'image', name: 'image', label: 'Floor plan image', accept: 'image' },
      { type: 'hotspots', name: 'hotspots', label: 'Callouts', imageField: 'image', help: 'Click on the plan to place a callout' },
    ],
  },
  {
    type: 'milestones',
    label: 'Milestone tracker',
    description: 'Vertical construction timeline from the Milestones collection.',
    fields: [eyebrow, heading, intro, { type: 'boolean', name: 'showGauge', label: 'Show evolution gauge' }],
  },
  {
    type: 'buildGallery',
    label: 'Behind-the-build gallery',
    description: 'Photos and videos from every milestone, filterable by phase.',
    fields: [eyebrow, heading, intro],
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'Free-form grid of photos and videos.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'gallery', name: 'items', label: 'Media', accept: 'any' },
      { type: 'select', name: 'layout', label: 'Layout', options: [
        { value: 'masonry', label: 'Masonry' },
        { value: 'grid', label: 'Even grid' },
      ] },
    ],
  },
  {
    type: 'waitlistForm',
    label: 'Founding Member VIP form',
    description: 'Lead capture form that triggers the welcome email.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'image', name: 'image', label: 'Side image', accept: 'image' },
      { type: 'stringList', name: 'perks', label: 'Founding member perks' },
      { type: 'text', name: 'submitLabel', label: 'Button label' },
      { type: 'text', name: 'successTitle', label: 'Success title' },
      { type: 'textarea', name: 'successMessage', label: 'Success message', rows: 3 },
    ],
  },
  {
    type: 'location',
    label: 'Neighborhood & parking',
    description: 'Map, address and parking details.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'text', name: 'mapQuery', label: 'Map search', help: 'Address or place Google Maps should pin' },
      { type: 'list', name: 'parking', label: 'Parking details', itemLabel: 'Detail', titleField: 'title', fields: [
        { type: 'icon', name: 'icon', label: 'Icon' },
        { type: 'text', name: 'title', label: 'Title' },
        { type: 'textarea', name: 'description', label: 'Description', rows: 2 },
      ] },
      { type: 'list', name: 'nearby', label: 'Nearby', itemLabel: 'Place', titleField: 'name', fields: [
        { type: 'text', name: 'name', label: 'Name' },
        { type: 'text', name: 'detail', label: 'Detail' },
      ] },
    ],
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Expandable questions and answers.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'list', name: 'items', label: 'Questions', itemLabel: 'Question', titleField: 'question', fields: [
        { type: 'text', name: 'category', label: 'Category', placeholder: 'Licensing' },
        { type: 'text', name: 'question', label: 'Question' },
        { type: 'richtext', name: 'answer', label: 'Answer', rows: 4 },
      ] },
    ],
  },
  {
    type: 'ctaBanner',
    label: 'Call-to-action banner',
    description: 'Bold closing banner with a button.',
    fields: [eyebrow, heading, intro, { type: 'image', name: 'background', label: 'Background image', accept: 'image' }, ...ctaFields],
  },
  {
    type: 'directory',
    label: 'Member directory',
    description: '"Find a Beauty Pro" directory with specialty filters.',
    fields: [eyebrow, heading, intro, { type: 'text', name: 'emptyMessage', label: 'Message when no pros are listed' }],
  },
  {
    type: 'tourBooking',
    label: 'Private tour booking',
    description: 'Calendar booking for private tours.',
    fields: [
      eyebrow,
      heading,
      intro,
      { type: 'image', name: 'image', label: 'Side image', accept: 'image' },
      { type: 'stringList', name: 'expectations', label: 'What to expect' },
      { type: 'text', name: 'successTitle', label: 'Success title' },
      { type: 'textarea', name: 'successMessage', label: 'Success message', rows: 3 },
    ],
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Long-form text such as policies.',
    fields: [heading, { type: 'richtext', name: 'body', label: 'Body', rows: 14 }],
  },
];

export const SECTION_MAP = Object.fromEntries(SECTIONS.map((s) => [s.type, s])) as Record<string, SectionDefinition>;

export function newSectionData(type: string): Record<string, unknown> {
  const def = SECTION_MAP[type];
  if (!def) return {};
  const data = emptyItem(def.fields);
  if ('useSiteCta' in data) data.useSiteCta = true;
  if (type === 'hero') Object.assign(data, { overlay: 45, height: 'full' });
  if (type === 'milestones') data.showGauge = true;
  if (type === 'instagram') data.limit = 6;
  return data;
}
