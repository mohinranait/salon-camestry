import Link from 'next/link';
import { PageHeading } from '@/components/admin/common';
import { getCloudinaryCredentials } from '@/lib/server/media';
import { MediaLibrary } from './media-library';

export default async function MediaPage() {
  const connected = Boolean(await getCloudinaryCredentials());
  return (
    <>
      <PageHeading
        title="Media library"
        description="Every photo and video on the site lives here, stored in Cloudinary. Upload once and reuse anywhere: each placement keeps its own alt text, and replacing a file updates it everywhere it is used."
      />
      {!connected && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Uploads are off until Cloudinary is connected.{' '}
          <Link href="/admin/cloudinary" className="font-medium underline">Add your Cloudinary credentials</Link>
        </p>
      )}
      <MediaLibrary />
    </>
  );
}
