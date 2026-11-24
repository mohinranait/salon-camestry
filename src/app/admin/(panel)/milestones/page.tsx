import { PageHeading } from '@/components/admin/common';
import { CollectionManager } from '@/components/admin/collection-manager';
import { MILESTONE_FIELDS } from '@/lib/collections';
import { buildProgress, getMilestones } from '@/lib/server/data';

export default async function MilestonesPage() {
  const milestones = await getMilestones();
  return (
    <>
      <PageHeading
        title="Build-out milestones"
        description={`Powers the May 2027 tracker and the Behind-the-Build gallery. The evolution gauge is currently at ${buildProgress(milestones)}%.`}
      />
      <CollectionManager
        collection="milestones"
        singular="milestone"
        items={JSON.parse(JSON.stringify(milestones))}
        fields={MILESTONE_FIELDS}
        defaults={{ status: 'upcoming' }}
      />
    </>
  );
}
