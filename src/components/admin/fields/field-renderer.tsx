'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DynamicIcon } from '@/components/icon';
import { emptyItem, ICON_OPTIONS, type Field } from '@/lib/fields';
import type { LinkValue, ResolvedMediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GalleryField, MediaField } from './media-field';
import { HotspotField, type Hotspot } from './hotspot-field';

type Values = Record<string, unknown>;

/** Renders a form for a list of field definitions. */
export function FieldsForm({ fields, value, onChange }: { fields: Field[]; value: Values; onChange: (value: Values) => void }) {
  return (
    <div className="grid gap-5">
      {fields.map((field) => (
        <FieldRow
          key={field.name}
          field={field}
          value={value?.[field.name]}
          siblings={value}
          onChange={(v) => onChange({ ...value, [field.name]: v })}
        />
      ))}
    </div>
  );
}

function FieldRow({ field, value, siblings, onChange }: { field: Field; value: unknown; siblings: Values; onChange: (v: unknown) => void }) {
  const id = `f-${field.name}-${field.label}`.replace(/\W+/g, '-');
  if (field.type === 'boolean') {
    return (
      <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3">
        <div className="space-y-0.5">
          <Label htmlFor={id}>{field.label}</Label>
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(Boolean(c))} />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      <FieldInput id={id} field={field} value={value} siblings={siblings} onChange={onChange} />
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

function FieldInput({ id, field, value, siblings, onChange }: { id: string; field: Field; value: unknown; siblings: Values; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case 'text':
      return <Input id={id} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <Textarea id={id} rows={field.rows ?? 3} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'richtext':
      return (
        <div className="space-y-1">
          <Textarea id={id} rows={field.rows ?? 5} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">
            Blank line = new paragraph · <code>**bold**</code> · <code>*italic*</code> · <code>[link](https://…)</code> · lines starting with <code>- </code> become a list
          </p>
        </div>
      );
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="max-w-40"
        />
      );
    case 'select':
      return (
        <Select items={field.options} value={String(value ?? field.options[0]?.value ?? '')} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id} className="w-full max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'icon':
      return <IconPicker value={String(value ?? '')} onChange={onChange} />;
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={String(value || '#000000')} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded border bg-transparent" />
          <Input id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="max-w-32 font-mono" />
        </div>
      );
    case 'link': {
      const link = (value as LinkValue) ?? { label: '', href: '' };
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input id={id} value={link.label ?? ''} placeholder="Button text" onChange={(e) => onChange({ ...link, label: e.target.value })} />
          <Input value={link.href ?? ''} placeholder="/page, #anchor or https://…" onChange={(e) => onChange({ ...link, href: e.target.value })} />
        </div>
      );
    }
    case 'image':
      return <MediaField value={(value as ResolvedMediaRef) ?? null} onChange={onChange} accept={field.accept} />;
    case 'gallery':
      return <GalleryField value={(value as ResolvedMediaRef[]) ?? []} onChange={onChange} accept={field.accept} />;
    case 'stringList':
      return <StringListInput id={id} value={(value as string[]) ?? []} onChange={onChange} />;
    case 'list':
      return <ListInput field={field} value={(value as Values[]) ?? []} onChange={onChange} />;
    case 'hotspots':
      return (
        <HotspotField
          image={siblings?.[field.imageField] as ResolvedMediaRef | null}
          value={(value as Hotspot[]) ?? []}
          onChange={onChange}
        />
      );
  }
}

function StringListInput({ id, value, onChange }: { id: string; value: string[]; onChange: (v: string[]) => void }) {
  // Keep the raw text locally so trailing newlines survive while typing.
  const [text, setText] = useState(value.join('\n'));
  return (
    <Textarea
      id={id}
      rows={Math.min(10, Math.max(3, value.length + 1))}
      value={text}
      placeholder="One item per line"
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} className="gap-2">
        <DynamicIcon name={value} className="size-4" /> {value || 'Choose icon'} <ChevronDown className="size-3.5 opacity-60" />
      </Button>
      {open && (
        <div className="grid grid-cols-8 gap-1 rounded-lg border bg-background p-2 sm:grid-cols-10">
          {ICON_OPTIONS.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              className={cn('flex aspect-square items-center justify-center rounded-md hover:bg-muted', value === name && 'bg-amber-100 text-amber-900')}
            >
              <DynamicIcon name={name} className="size-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListInput({ field, value, onChange }: { field: Extract<Field, { type: 'list' }>; value: Values[]; onChange: (v: Values[]) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const list = value ?? [];

  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= list.length) return;
    const next = [...list];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
    setOpenIndex(t);
  }

  return (
    <div className="space-y-2">
      {list.map((item, i) => {
        const title = field.titleField ? String(item?.[field.titleField] ?? '') : '';
        const isOpen = openIndex === i;
        return (
          <div key={i} className="rounded-lg border bg-background">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm" onClick={() => setOpenIndex(isOpen ? null : i)}>
                <ChevronDown className={cn('size-4 shrink-0 transition-transform', !isOpen && '-rotate-90')} />
                <span className="truncate font-medium">{title || `${field.itemLabel} ${i + 1}`}</span>
              </button>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown /></Button>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => onChange([...list.slice(0, i + 1), structuredClone(item), ...list.slice(i + 1)])} aria-label="Duplicate"><Copy /></Button>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Delete"><Trash2 /></Button>
            </div>
            {isOpen && (
              <div className="border-t bg-muted/20 p-3">
                <FieldsForm fields={field.fields} value={item ?? {}} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} />
              </div>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onChange([...list, emptyItem(field.fields)]);
          setOpenIndex(list.length);
        }}
      >
        <Plus /> Add {field.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
