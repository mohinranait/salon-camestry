import { listPages } from '@/lib/server/data';
import { PageHeading } from '@/components/admin/common';
import { PagesTable } from './pages-table';

export default async function PagesPage() {
  const pages = await listPages();
  return (
    <>
      <PageHeading
        title="Pages"
        description="Every page is built from sections you can edit, reorder, hide or show per launch phase."
      />
      <PagesTable pages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status, availability: p.availability, sections: p.sections.length, updatedAt: p.updatedAt }))} />
    </>
  );
}
