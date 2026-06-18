import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canApprove, isClient } from '@/lib/permissions';
import { notifyClientUsers, notifyAgency } from '@/lib/notify';
import { appBaseUrl } from '@/lib/appUrl';

export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, title: true },
  });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (!canApprove(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { status } = await req.json().catch(() => ({}));
  if (!['approved', 'revision'].includes(status)) {
    return NextResponse.json({ error: 'bad status' }, { status: 400 });
  }

  await prisma.post.update({ where: { id: post.id }, data: { status } });

  try {
    const approved = status === 'approved';
    const payload = {
      type: approved ? 'approval' : 'revision',
      titleEn: approved ? `<b>${user.fullName}</b> approved <b>${post.title}</b>` : `<b>${user.fullName}</b> requested a revision on <b>${post.title}</b>`,
      titleAr: approved ? `<b>${user.fullName}</b> اعتمد <b>${post.title}</b>` : `<b>${user.fullName}</b> طلب تعديلاً على <b>${post.title}</b>`,
      link: appBaseUrl() + `/posts/${post.id}`,
    };
    if (isClient(user.role)) await notifyAgency(user.workspaceId, user.id, payload);
    else await notifyClientUsers(post.clientId, user.id, payload);
  } catch (e) { console.error('notify(status) failed:', e.message); }

  return NextResponse.json({ ok: true, status });
}
