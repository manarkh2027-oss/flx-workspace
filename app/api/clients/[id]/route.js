import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';

// Agency-side: permanently delete a client and EVERYTHING it owns.
// Deletes in FK-safe order (comments → notifications → posts → campaigns →
// users → client) because the schema has no ON DELETE CASCADE.
export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManageClients(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!(await canAccessClient(user, params.id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const id = params.id;
  const [posts, users] = await Promise.all([
    prisma.post.findMany({ where: { clientId: id }, select: { id: true } }),
    prisma.user.findMany({ where: { clientId: id }, select: { id: true } }),
  ]);
  const postIds = posts.map((p) => p.id);
  const userIds = users.map((u) => u.id);

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { authorId: { in: userIds } }] } }),
    prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.post.deleteMany({ where: { clientId: id } }),
    prisma.campaign.deleteMany({ where: { clientId: id } }),
    prisma.user.deleteMany({ where: { clientId: id } }),
    prisma.client.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
