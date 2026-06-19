import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleClients, getActiveClientId } from '@/lib/access';
import { canSeeAllClients, canManageClients } from '@/lib/permissions';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const clients = await getAccessibleClients(user);
  const activeClientId = await getActiveClientId(user, clients);
  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0] || null;

  const safeUser = {
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
  };
  const safeClients = clients.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr, initials: c.initials }));
  const safeActive = activeClient
    ? { id: activeClient.id, name: activeClient.name, nameAr: activeClient.nameAr, initials: activeClient.initials }
    : null;

  return (
    <AppShell
      user={safeUser}
      clients={safeClients}
      activeClient={safeActive}
      canSwitch={canSeeAllClients(user.role) && safeClients.length > 1}
      canManage={canManageClients(user.role)}
    >
      {children}
    </AppShell>
  );
}
