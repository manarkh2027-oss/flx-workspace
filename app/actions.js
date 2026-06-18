'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleClientIds, ACTIVE_CLIENT_COOKIE } from '@/lib/access';
import { isClient } from '@/lib/permissions';

export async function setActiveClient(formData) {
  const user = await getCurrentUser();
  if (!user || isClient(user.role)) return; // clients cannot switch workspaces
  const clientId = String(formData.get('clientId') || '');
  const ids = await getAccessibleClientIds(user);
  if (!ids.includes(clientId)) return; // can only switch to a client they can access
  cookies().set(ACTIVE_CLIENT_COOKIE, clientId, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
}
