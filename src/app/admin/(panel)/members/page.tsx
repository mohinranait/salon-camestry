import Link from 'next/link';
import { PageHeading } from '@/components/admin/common';
import { CollectionManager } from '@/components/admin/collection-manager';
import { memberFields } from '@/lib/collections';
import { getMembers, getRawSettings } from '@/lib/server/data';

export default async function MembersPage() {
  const [members, settings] = await Promise.all([getMembers(false), getRawSettings()]);
  const live = settings.phase.current === 'phase2';
  return (
    <>
      <PageHeading
        title="Member directory"
        description="Pros listed on “Find a Beauty Pro”. Build the list now; it goes public when you switch the site to Phase 2."
      />
      {!live && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The directory page is hidden while the site is in Phase 1. Switch phases from the <Link className="underline" href="/admin">dashboard</Link>.
        </p>
      )}
      <CollectionManager
        collection="members"
        singular="pro"
        items={JSON.parse(JSON.stringify(members))}
        fields={memberFields(settings.directory.specialties)}
        defaults={{ specialty: settings.directory.specialties[0] ?? 'Hair', published: true }}
      />
    </>
  );
}
