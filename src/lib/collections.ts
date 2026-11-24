import type { Field } from './fields';

// Form definitions for the editable collections. Rendered by the same field
// engine as page sections.

export const MILESTONE_FIELDS: Field[] = [
  { type: 'text', name: 'title', label: 'Phase title', placeholder: 'Framing & Plumbing' },
  { type: 'text', name: 'dateLabel', label: 'Date / month', placeholder: 'January 2027' },
  {
    type: 'select',
    name: 'status',
    label: 'Status badge',
    options: [
      { value: 'completed', label: 'Completed' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'upcoming', label: 'Upcoming' },
    ],
  },
  { type: 'richtext', name: 'caption', label: 'Short update caption', rows: 4 },
  {
    type: 'gallery',
    name: 'gallery',
    label: 'Photos & walkthrough videos',
    accept: 'any',
    help: 'Progress photos, finish samples and videos. Swap in finished walkthroughs at launch.',
  },
];

export const SUITE_FIELDS: Field[] = [
  { type: 'text', name: 'name', label: 'Suite type name', placeholder: 'Single Wet Suite' },
  { type: 'select', name: 'size', label: 'Size', options: [{ value: 'single', label: 'Single' }, { value: 'double', label: 'Double' }] },
  { type: 'select', name: 'wetDry', label: 'Wet or dry', options: [{ value: 'wet', label: 'Wet (shampoo bowl in suite)' }, { value: 'dry', label: 'Dry' }] },
  { type: 'number', name: 'count', label: 'Number of suites of this type', min: 0 },
  { type: 'number', name: 'available', label: 'Still available', min: 0 },
  { type: 'text', name: 'sqft', label: 'Approx. size', placeholder: '120–140 sq ft' },
  { type: 'text', name: 'priceLabel', label: 'Pricing label', placeholder: 'From $XXX / week or "Pricing on tour"' },
  { type: 'textarea', name: 'summary', label: 'One-line summary', rows: 2 },
  { type: 'richtext', name: 'description', label: 'Description', rows: 4 },
  { type: 'stringList', name: 'features', label: 'Included furnishings & features', help: 'One per line' },
  { type: 'image', name: 'image', label: 'Main image', accept: 'image' },
  { type: 'gallery', name: 'gallery', label: 'More photos', accept: 'image' },
  { type: 'boolean', name: 'published', label: 'Show on website' },
];

export function memberFields(specialties: string[]): Field[] {
  return [
    { type: 'text', name: 'name', label: 'Pro name' },
    { type: 'text', name: 'businessName', label: 'Business name' },
    { type: 'text', name: 'suiteNumber', label: 'Suite number', placeholder: '07' },
    { type: 'select', name: 'specialty', label: 'Specialty category', options: specialties.map((s) => ({ value: s, label: s })) },
    { type: 'image', name: 'headshot', label: 'Headshot', accept: 'image' },
    { type: 'textarea', name: 'bio', label: 'Short bio', rows: 4 },
    { type: 'text', name: 'instagram', label: 'Instagram handle', placeholder: 'yourhandle' },
    { type: 'text', name: 'bookingUrl', label: 'External booking URL', placeholder: 'https://glossgenius.com/…', help: 'GlossGenius, Vagaro, Square, Booksy or any booking link' },
    { type: 'boolean', name: 'featured', label: 'Featured pro' },
    { type: 'boolean', name: 'published', label: 'Show in directory' },
  ];
}
