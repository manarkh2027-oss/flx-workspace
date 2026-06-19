import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';
import { PLATFORM_KEYS, getPlatform, isPlatformConfigured } from '@/lib/publishing/platforms';

// List every platform with its connection + configuration status.
// Tokens are NEVER returned to the client.
export async function GET() {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const rows = await prisma.socialAccount.findMany({ where: { workspaceId: user.workspaceId } });
  const byPlatform = Object.fromEntries(rows.map((r) => [r.platform, r]));

  const accounts = PLATFORM_KEYS.map((key) => {
    const p = getPlatform(key);
    const acc = byPlatform[key];
    return {
      platform: key,
      en: p.en, ar: p.ar, icon: p.icon, color: p.color, docs: p.docs,
      configured: isPlatformConfigured(key),                 // app credentials present?
      status: acc?.status || 'disconnected',
      accountName: acc?.accountName || null,
      connectedAt: acc?.updatedAt || null,
    };
  });
  return NextResponse.json({ accounts });
}
