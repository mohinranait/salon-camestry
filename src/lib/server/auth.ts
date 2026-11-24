import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/prisma/db';
import { SESSION_COOKIE, signSession, verifySession, type SessionPayload } from './session';

export async function createSession(user: { id: string; email: string; name: string; role: string }) {
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  // The account may have been removed since the token was issued.
  const user = await db.orm.admin_users.where({ id: session.sub }).select('id').first();
  return user ? session : null;
});

/** Guards server actions and admin pages. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}
