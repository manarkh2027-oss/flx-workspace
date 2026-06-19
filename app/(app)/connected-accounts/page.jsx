import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canManageClients } from '@/lib/permissions';
import { PLATFORM_KEYS, getPlatform, isPlatformConfigured } from '@/lib/publishing/platforms';
import ConnectedAccounts from '@/components/ConnectedAccounts';

export const dynamic = 'force-dynamic';

export default async function ConnectedAccountsPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) redirect('/');

  const rows = await prisma.socialAccount.findMany({ where: { workspaceId: user.workspaceId } });
  const byPlatform = Object.fromEntries(rows.map((r) => [r.platform, r]));

  const accounts = PLATFORM_KEYS.map((key) => {
    const p = getPlatform(key);
    const acc = byPlatform[key];
    return {
      platform: key, en: p.en, ar: p.ar, icon: p.icon, color: p.color, docs: p.docs,
      configured: isPlatformConfigured(key),
      status: acc?.status || 'disconnected',
      accountName: acc?.accountName || null,
    };
  });

  const banner = {
    connected: typeof searchParams?.connected === 'string' ? searchParams.connected : null,
    error: typeof searchParams?.error === 'string' ? searchParams.error : null,
  };

  return <ConnectedAccounts accounts={accounts} banner={banner} />;
}
