'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FieldsForm } from '@/components/admin/fields/field-renderer';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { MediaThumb } from '@/components/admin/media/media-thumb';
import { emptyItem, type Field } from '@/lib/fields';
import type { ResolvedMediaRef } from '@/lib/types';
import { deleteCollectionItem, reorderCollection, saveCollectionItem, type CollectionName } from '@/app/admin/actions';

type Item = { id: string; [key: string]: unknown };

const STATUS_TONE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  'in-progress': 'bg-amber-100 text-amber-900',
  upcoming: 'bg-zinc-100 text-zinc-700',
};

function Summary({ collection, item }: { collection: CollectionName; item: Item }) {
  if (collection === 'milestones') {
    const gallery = (item.gallery as ResolvedMediaRef[]) ?? [];
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex -space-x-3">
          {gallery.slice(0, 3).map((g, i) => (
            <MediaThumb key={i} media={g.media} className="size-11 rounded-md border-2 border-background" />
          ))}
          {gallery.length === 0 && <div className="size-11 rounded-md bg-muted" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{String(item.title)}</p>
          <p className="text-xs text-muted-foreground">
            {String(item.dateLabel)} · {gallery.length} media
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[String(item.status)] ?? ''}`}>
          {String(item.status).replace('-', ' ')}
        </span>
      </div>
    );
  }
  const image = (collection === 'suites' ? item.image : item.headshot) as ResolvedMediaRef | null;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {image ? <MediaThumb media={image.media} className={collection === 'members' ? 'size-11 rounded-full' : 'size-11 rounded-md'} /> : <div className="size-11 rounded-md bg-muted" />}
      <div className="min-w-0">
        <p className="truncate font-medium">{String(item.name)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {collection === 'suites'
            ? `${item.count} suites · ${item.available} available · ${item.sqft}`
            : `${item.businessName || '—'} · Suite ${item.suiteNumber || '—'} · ${item.specialty}`}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 gap-1">
        {collection === 'members' && Boolean(item.featured) && <Badge variant="outline">Featured</Badge>}
        {!item.published && <Badge variant="secondary">Hidden</Badge>}
      </div>
    </div>
  );
}

export function CollectionManager({
  collection,
  items,
  fields,
  defaults,
  singular,
}: {
  collection: CollectionName;
  items: Item[];
  fields: Field[];
  defaults?: Record<string, unknown>;
  singular: string;
}) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [editing, setEditing] = useState<{ id: string | null; data: Record<string, unknown> } | null>(null);
  const [order, setOrder] = useState<Item[]>(items);
  // Keep local order in sync when the server sends a fresh list.
  const [source, setSource] = useState(items);
  if (source !== items) {
    setSource(items);
    setOrder(items);
  }

  function move(index: number, dir: -1 | 1) {
    const t = index + dir;
    if (t < 0 || t >= order.length) return;
    const next = [...order];
    [next[index], next[t]] = [next[t], next[index]];
    setOrder(next);
    run(() => reorderCollection(collection, next.map((i) => i.id)), undefined, () => router.refresh());
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ id: null, data: { ...emptyItem(fields), ...defaults } })}>
          <Plus /> Add {singular}
        </Button>
      </div>

      {order.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-background">
          {order.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex flex-col">
                <Button size="icon-xs" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp /></Button>
                <Button size="icon-xs" variant="ghost" onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label="Move down"><ArrowDown /></Button>
              </div>
              <button type="button" className="flex min-w-0 flex-1 text-left" onClick={() => setEditing({ id: item.id, data: structuredClone(item) })}>
                <Summary collection={collection} item={item} />
              </button>
              <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ id: item.id, data: structuredClone(item) })} aria-label="Edit"><Pencil /></Button>
              <ConfirmDialog
                title={`Delete this ${singular}?`}
                description="This cannot be undone. Its images stay in the media library."
                onConfirm={() => run(() => deleteCollectionItem(collection, item.id), 'Deleted', () => router.refresh())}
                trigger={(o) => <Button size="icon-sm" variant="ghost" onClick={o} aria-label="Delete"><Trash2 /></Button>}
              />
            </div>
          ))}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing?.id ? `Edit ${singular}` : `New ${singular}`}</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="px-4">
              <FieldsForm fields={fields} value={editing.data} onChange={(data) => setEditing({ ...editing, data })} />
            </div>
          )}
          <SheetFooter className="sticky bottom-0 border-t bg-background">
            <Button
              disabled={pending}
              onClick={() =>
                editing &&
                run(() => saveCollectionItem(collection, editing.id, editing.data), 'Saved', (r) => {
                  if (r.ok) {
                    setEditing(null);
                    router.refresh();
                  }
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />} Save {singular}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
