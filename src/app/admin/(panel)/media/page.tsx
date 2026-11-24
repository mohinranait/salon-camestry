import { PageHeading } from '@/components/admin/common';
import { MediaLibrary } from './media-library';

export default function MediaPage() {
  return (
    <>
      <PageHeading
        title="Media library"
        description="Every photo and video on the site lives here. Upload once and reuse anywhere: each placement keeps its own alt text, and replacing a file updates it everywhere it is used."
      />
      <MediaLibrary />
    </>
  );
}
