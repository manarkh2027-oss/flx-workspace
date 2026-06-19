import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { isClient } from '@/lib/permissions';
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

  const { body } = await req.json().catch(() => ({}));
  const text = String(body || '').trim();
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 });

  await prisma.comment.create({ data: { postId: post.id, authorId: user.id, body: text } });

  // Fire-and-forget: never block the button on email/WhatsApp delivery.
  const payload = {
    type: 'comment',
    titleEn: `<b>${user.fullName}</b> commented on <b>${post.title}</b>`,
    titleAr: `<b>${user.fullName}</b> علّق على <b>${post.title}</b>`,
    link: appBaseUrl() + `/posts/${post.id}`,
  };
  Promise.resolve()
    .then(() => (isClient(user.role) ? notifyAgency(user.workspaceId, user.id, payload) : notifyClientUsers(post.clientId, user.id, payload)))
    .catch((e) => console.error('notify(comment) failed:', e.message));

  return NextResponse.json({ ok: true });
}
