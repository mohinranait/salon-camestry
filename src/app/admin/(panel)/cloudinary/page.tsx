import { db } from '@/prisma/db';
import { PageHeading } from '@/components/admin/common';
import { CLOUDINARY_SETTINGS_KEY, decryptSecret, parseStoredConfig } from '@/lib/cloudinary';
import { CloudinaryForm } from './cloudinary-form';

export default async function CloudinaryPage() {
  const [row, media] = await Promise.all([
    db.orm.settings.where({ key: CLOUDINARY_SETTINGS_KEY }).first(),
    db.orm.media.select('size').all(),
  ]);
  const config = parseStoredConfig(row?.data);
  const hasSecret = Boolean(config.apiSecretEncrypted);
  // A secret saved under a different AUTH_SECRET can no longer be read.
  const secretUnreadable = hasSecret && decryptSecret(config.apiSecretEncrypted) === null;

  return (
    <>
      <PageHeading
        title="Cloudinary"
        description="Every photo and video uploaded from the admin panel is stored in your Cloudinary account and delivered from its CDN, resized and converted to the best format for each visitor."
      />
      <CloudinaryForm
        initial={{ enabled: config.enabled, cloudName: config.cloudName, apiKey: config.apiKey, apiSecret: '', folder: config.folder }}
        hasSecret={hasSecret && !secretUnreadable}
        secretUnreadable={secretUnreadable}
        stats={{ files: media.length, bytes: media.reduce((sum, m) => sum + m.size, 0) }}
      />
    </>
  );
}
