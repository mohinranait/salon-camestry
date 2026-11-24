'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldsForm } from '@/components/admin/fields/field-renderer';
import { useAction } from '@/components/admin/common';
import { SETTINGS_TABS } from '@/lib/settings-fields';
import type { SiteSettings, WeeklySlots } from '@/lib/settings';
import { saveSettings } from '@/app/admin/actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Obj = Record<string, unknown>;

function getAt(obj: Obj, path: string[]): Obj {
  return path.reduce<Obj>((o, key) => (o?.[key] as Obj) ?? {}, obj);
}

function setAt(obj: Obj, path: string[], value: Obj): Obj {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  return { ...obj, [head]: setAt((obj[head] as Obj) ?? {}, rest, value) };
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const { pending, run } = useAction();
  const dirty = useMemo(() => JSON.stringify(settings) !== saved, [settings, saved]);

  function save() {
    run(() => saveSettings(settings), 'Settings saved', (r) => {
      if (r.ok) {
        setSaved(JSON.stringify(settings));
        router.refresh();
      }
    });
  }

  return (
    <Tabs defaultValue="general" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="h-auto flex-wrap">
          {SETTINGS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
        </Button>
      </div>

      {SETTINGS_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4">
          {tab.groups.map((group) => (
            <section key={group.path.join('.')} className="rounded-xl border bg-background p-5">
              <h2 className="font-semibold">{group.title}</h2>
              {group.description && <p className="mt-1 mb-4 max-w-3xl text-sm text-muted-foreground">{group.description}</p>}
              <div className={group.description ? '' : 'mt-4'}>
                <FieldsForm
                  fields={group.fields}
                  value={getAt(settings as unknown as Obj, group.path)}
                  onChange={(v) => setSettings((s) => setAt(s as unknown as Obj, group.path, v) as unknown as SiteSettings)}
                />
              </div>
            </section>
          ))}
          {tab.value === 'booking' && (
            <WeeklyEditor
              value={settings.booking.weekly}
              onChange={(weekly) => setSettings((s) => ({ ...s, booking: { ...s.booking, weekly } }))}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function WeeklyEditor({ value, onChange }: { value: WeeklySlots; onChange: (v: WeeklySlots) => void }) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const byDay = DAYS.map((_, day) => value.find((w) => w.day === day) ?? { day, times: [] });
  const update = (day: number, times: string[]) =>
    onChange(byDay.map((w) => (w.day === day ? { day, times: [...new Set(times)].sort() } : w)));

  return (
    <section className="rounded-xl border bg-background p-5">
      <h2 className="font-semibold">Weekly tour times</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">Start times offered each day (studio time, Atlanta). Days without times are closed.</p>
      <div className="divide-y">
        {byDay.map((w) => (
          <div key={w.day} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
            <span className="w-28 shrink-0 text-sm font-medium">{DAYS[w.day]}</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {w.times.length === 0 && <span className="text-xs text-muted-foreground">Closed</span>}
              {w.times.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                  {t}
                  <button type="button" aria-label={`Remove ${t}`} onClick={() => update(w.day, w.times.filter((x) => x !== t))}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input
                type="time"
                className="h-8 w-32"
                value={drafts[w.day] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [w.day]: e.target.value }))}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!drafts[w.day]}
                onClick={() => {
                  update(w.day, [...w.times, drafts[w.day]]);
                  setDrafts((d) => ({ ...d, [w.day]: '' }));
                }}
              >
                <Plus /> Add
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
