import { PageHeading } from '@/components/admin/common';
import { getRawSettings } from '@/lib/server/data';
import { resolveMedia } from '@/lib/server/media';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await resolveMedia(await getRawSettings());
  return (
    <>
      <PageHeading title="Site settings" description="Brand, launch phase, menus, SEO, emails and booking rules for the whole site." />
      <SettingsForm initial={JSON.parse(JSON.stringify(settings))} />
    </>
  );
}
