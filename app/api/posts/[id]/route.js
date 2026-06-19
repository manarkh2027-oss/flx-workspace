import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canUpload } from '@/lib/permissions';
import { notifyClientUsers } from '@/lib/notify';
import { appBaseUrl } from '@/lib/appUrl';

const TYPES = ['video', 'image', 'design', 'copy'];
const PLATFORMS = ['instagram', 'facebook', 'x', 'youtube', 'tiktok', 'linkedin'];
const DOW = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الإثنين' }, { en: 'Tue', ar: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء' }, { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
];

// Agency-side: edit an existing material (replace file, change title/details/
// platform/date/type). Produces a new version and re-opens it for review.
export async function PATCH(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canUpload(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, clientId: true, version: true } });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const data = {};

  if (TYPES.includes(b.type)) data.type = b.type;
  if (typeof b.title === 'string' && b.title.trim()) { data.title = b.title.trim().slice(0, 160); data.titleAr = data.title; }
  if (typeof b.body === 'string') data.body = b.body.trim().slice(0, 5000) || null;
  if (PLATFORMS.includes(b.platform)) data.platform = b.platform;
  if ('mediaUrl' in b) data.mediaUrl = typeof b.mediaUrl === 'string' && b.mediaUrl.trim() ? b.mediaUrl.trim() : null;
  if ('publishAt' in b) {
    if (b.publishAt) {
      const dt = new Date(b.publishAt);
      if (!Number.isNaN(dt.getTime())) { data.publishAt = dt; data.dayEn = DOW[dt.getDay()].en; data.dayAr = DOW[dt.getDay()].ar; }
    } else { data.publishAt = null; data.dayEn = null; data.dayAr = null; }
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'nothing-to-update' }, { status: 400 });

  // A fresh edit is a new version the client should review again.
  data.version = (post.version || 1) + 1;
  data.status = 'review';

  const updated = await prisma.post.update({ where: { id: post.id }, data });

  const payload = {
    type: 'revision',
    titleEn: `<b>${user.fullName}</b> updated <b>${updated.title}</b> — a new version is ready`,
    titleAr: `<b>${user.fullName}</b> حدّث <b>${updated.title}</b> — نسخة جديدة جاهزة للمراجعة`,
    link: appBaseUrl() + `/posts/${post.id}`,
  };
  Promise.resolve()
    .then(() => notifyClientUsers(post.clientId, user.id, payload))
    .catch((e) => console.error('notify(edit) failed:', e.message));

  return NextResponse.json({ ok: true, id: post.id });
}

// Agency-side: permanently delete a single material (and its comments).
export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canUpload(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, clientId: true } });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { postId: post.id } }),
    prisma.post.delete({ where: { id: post.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
