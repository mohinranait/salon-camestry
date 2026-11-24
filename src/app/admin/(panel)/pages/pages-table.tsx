'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useAction } from '@/components/admin/common';
import { createPage, deletePage } from '@/app/admin/actions';

type Row = { id: string; title: string; slug: string; status: string; availability: string; sections: number; updatedAt: string };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function PagesTable({ pages }: { pages: Row[] }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> New page
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Shown in</TableHead>
              <TableHead className="hidden lg:table-cell">Sections</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => {
              const href = p.slug === 'home' ? '/' : `/${p.slug}`;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                    <p className="text-xs text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{href}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.availability === 'all' ? 'Both phases' : p.availability === 'phase2' ? 'Phase 2 only' : 'Phase 1 only'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{p.sections}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button nativeButton={false} size="icon-sm" variant="ghost" render={<a href={href} target="_blank" rel="noreferrer" aria-label="View page" />}>
                        <ExternalLink />
                      </Button>
                      <Button nativeButton={false} size="icon-sm" variant="ghost" render={<Link href={`/admin/pages/${p.id}`} aria-label="Edit page" />}>
                        <Pencil />
                      </Button>
                      {p.slug !== 'home' && (
                        <ConfirmDialog
                          title={`Delete "${p.title}"?`}
                          description="The page and all its sections are removed. This cannot be undone. Images stay in the media library."
                          onConfirm={() => run(() => deletePage(p.id), 'Page deleted', () => router.refresh())}
                          trigger={(o) => (
                            <Button size="icon-sm" variant="ghost" onClick={o} aria-label="Delete page">
                              <Trash2 />
                            </Button>
                          )}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-title">Title</Label>
              <Input
                id="np-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-slug">URL</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                /
                <Input
                  id="np-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={pending || !title || !slug}
              onClick={() =>
                run(() => createPage({ title, slug }), 'Page created', (r) => {
                  if (r.ok && r.id) router.push(`/admin/pages/${r.id}`);
                })
              }
            >
              Create page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
