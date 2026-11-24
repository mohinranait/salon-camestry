'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Copy, ExternalLink, EyeOff, Loader2, Plus, Save, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FieldsForm } from '@/components/admin/fields/field-renderer';
import { MediaField } from '@/components/admin/fields/media-field';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { SECTION_MAP, SECTIONS, newSectionData } from '@/lib/sections/registry';
import type { PageDoc, PhaseRule, ResolvedMediaRef, SectionInstance, SectionTheme } from '@/lib/types';
import { cn } from '@/lib/utils';
import { savePage } from '@/app/admin/actions';

const PHASE_OPTIONS = [
  { value: 'all', label: 'Both phases' },
  { value: 'phase1', label: 'Phase 1 only (pre-launch)' },
  { value: 'phase2', label: 'Phase 2 only (launch)' },
];
const THEME_OPTIONS = [
  { value: 'light', label: 'White' },
  { value: 'ivory', label: 'Ivory' },
  { value: 'dark', label: 'Black & gold' },
];

function SimpleSelect({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PageEditor({ initial }: { initial: PageDoc }) {
  const router = useRouter();
  const [page, setPage] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const { pending, run } = useAction();

  const dirty = useMemo(() => JSON.stringify(page) !== saved, [page, saved]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = <K extends keyof PageDoc>(key: K, value: PageDoc[K]) => setPage((p) => ({ ...p, [key]: value }));
  const setSections = (fn: (s: SectionInstance[]) => SectionInstance[]) => setPage((p) => ({ ...p, sections: fn(p.sections) }));
  const updateSection = (id: string, patch: Partial<SectionInstance>) =>
    setSections((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  function move(index: number, dir: -1 | 1) {
    setSections((list) => {
      const t = index + dir;
      if (t < 0 || t >= list.length) return list;
      const next = [...list];
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  }

  function addSection(type: string, at: number) {
    const section: SectionInstance = {
      id: crypto.randomUUID(),
      type,
      enabled: true,
      phase: 'all',
      anchor: '',
      theme: type === 'hero' || type === 'ctaBanner' || type === 'pageHeader' ? 'dark' : 'light',
      data: newSectionData(type),
    };
    setSections((list) => [...list.slice(0, at), section, ...list.slice(at)]);
    setOpenId(section.id);
    setAdding(null);
  }

  function save() {
    run(() => savePage(page.id, page), 'Page saved', (r) => {
      if (r.ok) {
        setSaved(JSON.stringify(page));
        router.refresh();
      }
    });
  }

  const href = page.slug === 'home' ? '/' : `/${page.slug}`;

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link href="/admin/pages" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> All pages
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title || 'Untitled page'}</h1>
        </div>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<a href={href} target="_blank" rel="noreferrer" />}>
            <ExternalLink /> View
          </Button>
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {page.sections.length === 0 && (
            <div className="rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
              This page has no sections yet.
            </div>
          )}
          {page.sections.map((section, index) => {
            const def = SECTION_MAP[section.type];
            const open = openId === section.id;
            const headline = String(section.data.heading ?? section.data.eyebrow ?? '').split('\n')[0];
            return (
              <div key={section.id}>
                <div className={cn('overflow-hidden rounded-xl border bg-background transition', open && 'ring-2 ring-amber-400/60', !section.enabled && 'opacity-60')}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button type="button" onClick={() => setOpenId(open ? null : section.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <ChevronDown className={cn('size-4 shrink-0 transition-transform', !open && '-rotate-90')} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{def?.label ?? section.type}</span>
                          {!section.enabled && <Badge variant="secondary"><EyeOff className="size-3" /> Hidden</Badge>}
                          {section.phase !== 'all' && <Badge variant="outline">{section.phase === 'phase1' ? 'Phase 1' : 'Phase 2'}</Badge>}
                        </span>
                        {headline && <span className="block truncate text-xs text-muted-foreground">{headline}</span>}
                      </span>
                    </button>
                    <Switch checked={section.enabled} onCheckedChange={(c) => updateSection(section.id, { enabled: Boolean(c) })} aria-label="Show section" />
                    <Button size="icon-sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === page.sections.length - 1} aria-label="Move down"><ArrowDown /></Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Duplicate"
                      onClick={() => setSections((list) => [...list.slice(0, index + 1), { ...structuredClone(section), id: crypto.randomUUID() }, ...list.slice(index + 1)])}
                    >
                      <Copy />
                    </Button>
                    <ConfirmDialog
                      title="Remove this section?"
                      description="The section is removed when you save the page."
                      confirmLabel="Remove"
                      onConfirm={() => setSections((list) => list.filter((s) => s.id !== section.id))}
                      trigger={(o) => (
                        <Button size="icon-sm" variant="ghost" onClick={o} aria-label="Remove section"><Trash2 /></Button>
                      )}
                    />
                  </div>
                  {open && (
                    <div className="space-y-5 border-t bg-muted/20 p-4">
                      {def?.description && <p className="text-xs text-muted-foreground">{def.description}</p>}
                      <div className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label>Background</Label>
                          <SimpleSelect value={section.theme} options={THEME_OPTIONS} onChange={(v) => updateSection(section.id, { theme: v as SectionTheme })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Show in</Label>
                          <SimpleSelect value={section.phase} options={PHASE_OPTIONS} onChange={(v) => updateSection(section.id, { phase: v as PhaseRule })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Anchor id</Label>
                          <Input
                            value={section.anchor}
                            placeholder="e.g. waitlist"
                            onChange={(e) => updateSection(section.id, { anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          />
                        </div>
                      </div>
                      {def ? (
                        <FieldsForm fields={def.fields} value={section.data} onChange={(data) => updateSection(section.id, { data })} />
                      ) : (
                        <p className="text-sm text-destructive">Unknown section type “{section.type}”.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="group flex justify-center py-1">
                  <button
                    type="button"
                    onClick={() => setAdding(index + 1)}
                    className="flex items-center gap-1 rounded-full px-3 py-0.5 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
                  >
                    <Plus className="size-3" /> Insert section here
                  </button>
                </div>
              </div>
            );
          })}
          <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding(page.sections.length)}>
            <Plus /> Add section
          </Button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start">
          <div className="space-y-4 rounded-xl border bg-background p-4">
            <h2 className="text-sm font-semibold">Page settings</h2>
            <div className="space-y-1.5">
              <Label htmlFor="pg-title">Title</Label>
              <Input id="pg-title" value={page.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-slug">URL</Label>
              <Input
                id="pg-slug"
                value={page.slug === 'home' ? '/' : page.slug}
                disabled={page.slug === 'home'}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SimpleSelect
                value={page.status}
                options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft (hidden)' }]}
                onChange={(v) => set('status', v as PageDoc['status'])}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Available in</Label>
              <SimpleSelect value={page.availability} options={PHASE_OPTIONS} onChange={(v) => set('availability', v as PhaseRule)} />
              <p className="text-xs text-muted-foreground">Phase 2 pages, like the directory and tour booking, stay hidden until you switch the site to Phase 2.</p>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border bg-background p-4">
            <h2 className="text-sm font-semibold">Search engine (SEO)</h2>
            <div className="space-y-1.5">
              <Label htmlFor="pg-seo-title">Meta title</Label>
              <Input id="pg-seo-title" value={page.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
              <p className={cn('text-xs', page.seoTitle.length > 60 ? 'text-amber-600' : 'text-muted-foreground')}>{page.seoTitle.length}/60 characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-seo-desc">Meta description</Label>
              <Textarea id="pg-seo-desc" rows={4} value={page.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
              <p className={cn('text-xs', page.seoDescription.length > 160 ? 'text-amber-600' : 'text-muted-foreground')}>{page.seoDescription.length}/160 characters</p>
            </div>
            <div className="space-y-1.5">
              <Label>Social share image</Label>
              <MediaField value={page.ogImage} onChange={(v: ResolvedMediaRef | null) => set('ogImage', v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="pg-noindex">Hide from search engines</Label>
              <Switch id="pg-noindex" checked={page.noIndex} onCheckedChange={(c) => set('noIndex', Boolean(c))} />
            </div>
          </div>
        </aside>
      </div>

      <div
        className={cn(
          'fixed right-4 bottom-4 left-4 z-30 flex items-center justify-between gap-3 rounded-xl border bg-black px-4 py-3 text-white shadow-2xl transition md:left-auto md:w-[28rem]',
          dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <span className="text-sm">You have unsaved changes</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setPage(JSON.parse(saved))}>Discard</Button>
          <Button size="sm" className="bg-[#c6a15b] text-black hover:bg-[#d8b56f]" onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save page
          </Button>
        </div>
      </div>

      <Dialog open={adding !== null} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add a section</DialogTitle>
            <DialogDescription>Pick a block. You can edit, move or hide it afterwards.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => addSection(s.type, adding ?? page.sections.length)}
                className="rounded-lg border p-3 text-left transition hover:border-amber-500 hover:bg-amber-50/50"
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.description}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
