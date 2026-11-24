import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { db } from '@/prisma/db';
import { toPageDoc } from '@/lib/server/data';
import { resolveMedia } from '@/lib/server/media';
import { PageEditor } from './page-editor';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const row = await db.orm.pages.where({ id }).first();
  if (!row) notFound();
  const page = await resolveMedia(toPageDoc(row));
  return <PageEditor initial={JSON.parse(JSON.stringify(page))} />;
}
