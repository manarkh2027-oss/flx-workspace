import { cookies } from 'next/headers';
import { prisma } from './db';
import { isClient } from './permissions';

export const ACTIVE_CLIENT_COOKIE = 'flx_active_client';

// The set of clients a user is allowed to see.
//  - a CLIENT user  -> only their own client (hard isolation)
//  - an AGENCY user -> every client in their workspace
export async function getAccessibleClients(user) {
  if (!user) return [];
  if (isClient(user.role)) {
    if (!user.clientId) return [];
    const c = await prisma.client.findUnique({ where: { id: user.clientId } });
    return c ? [c] : [];
  }
  return prisma.client.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { name: 'asc' },
  });
}

export async function getAccessibleClientIds(user) {
  const clients = await getAccessibleClients(user);
  return clients.map((c) => c.id);
}

// The client whose workspace is currently being viewed.
//  - a CLIENT user is always pinned to their own client (cookie ignored)
//  - an AGENCY user can switch; choice stored in a cookie, validated against access
export async function getActiveClientId(user, accessibleClients) {
  if (!user) return null;
  if (isClient(user.role)) return user.clientId;

  const clients = accessibleClients || (await getAccessibleClients(user));
  const ids = clients.map((c) => c.id);
  const picked = cookies().get(ACTIVE_CLIENT_COOKIE)?.value;
  if (picked && ids.includes(picked)) return picked;
  return ids[0] || null;
}

// Guard: is this user allowed to touch data belonging to `clientId`?
export async function canAccessClient(user, clientId) {
  if (!user || !clientId) return false;
  const ids = await getAccessibleClientIds(user);
  return ids.includes(clientId);
}
