// Declarative field definitions. The admin panel renders forms from these, so
// every section and collection is editable without custom form code.

export type SelectOption = { value: string; label: string };

type Base = { name: string; label: string; help?: string; placeholder?: string };

export type Field =
  | (Base & { type: 'text' })
  | (Base & { type: 'textarea'; rows?: number })
  | (Base & { type: 'richtext'; rows?: number })
  | (Base & { type: 'number'; min?: number; max?: number; step?: number })
  | (Base & { type: 'boolean' })
  | (Base & { type: 'select'; options: SelectOption[] })
  | (Base & { type: 'icon' })
  | (Base & { type: 'color' })
  | (Base & { type: 'link' })
  | (Base & { type: 'image'; accept?: 'image' | 'video' | 'any' })
  | (Base & { type: 'gallery'; accept?: 'image' | 'video' | 'any' })
  | (Base & { type: 'stringList' })
  | (Base & { type: 'list'; itemLabel: string; titleField?: string; fields: Field[] })
  | (Base & { type: 'hotspots'; imageField: string });

export type FieldType = Field['type'];

/** Builds an empty value for a field. */
export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'select':
      return field.options[0]?.value ?? '';
    case 'link':
      return { label: '', href: '' };
    case 'image':
      return null;
    case 'gallery':
    case 'stringList':
    case 'list':
    case 'hotspots':
      return [];
    default:
      return '';
  }
}

export function emptyItem(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}

/** Lucide icon names offered by the `icon` field. */
export const ICON_OPTIONS = [
  'KeyRound',
  'ShieldCheck',
  'Droplets',
  'Wind',
  'WashingMachine',
  'Wifi',
  'Zap',
  'Coffee',
  'MonitorSmartphone',
  'ParkingSquare',
  'Sparkles',
  'Scissors',
  'Armchair',
  'Lamp',
  'Lock',
  'Clock',
  'Sun',
  'Star',
  'Heart',
  'Gem',
  'Palette',
  'Paintbrush',
  'Ruler',
  'Hammer',
  'HardHat',
  'Camera',
  'Video',
  'MapPin',
  'Car',
  'Phone',
  'Mail',
  'Calendar',
  'Users',
  'Crown',
  'FlaskConical',
  'Atom',
  'Building2',
  'DoorOpen',
  'Leaf',
  'BadgeCheck',
] as const;
