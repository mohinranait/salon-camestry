import { PageHeading } from '@/components/admin/common';
import { CollectionManager } from '@/components/admin/collection-manager';
import { SUITE_FIELDS } from '@/lib/collections';
import { getSuites } from '@/lib/server/data';

export default async function SuitesPage() {
  const suites = await getSuites(false);
  const total = suites.reduce((sum, s) => sum + s.count, 0);
  return (
    <>
      <PageHeading
        title="Suites"
        description={`Suite configurations shown on The Suites page. ${total} suites across ${suites.length} types.`}
      />
      <CollectionManager
        collection="suites"
        singular="suite type"
        items={JSON.parse(JSON.stringify(suites))}
        fields={SUITE_FIELDS}
        defaults={{ size: 'single', wetDry: 'dry', published: true }}
      />
    </>
  );
}
