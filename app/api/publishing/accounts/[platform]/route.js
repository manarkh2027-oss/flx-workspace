import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';

// Disconnect a platform (revokes our copy of the tokens).
export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // TODO(engineer): also call the provider's token-revocation endpoint here so the
  // access is revoked on their side, not just removed from our database.
  await prisma.socialAccount.deleteMany({ where: { workspaceId: user.workspaceId, platform: params.platform } });
  return NextResponse.json({ ok: true });
}
