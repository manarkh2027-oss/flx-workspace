import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canUpload } from '@/lib/permissions';
import { notifyClientUsers } from '@/lib/notify';
import { appBaseUrl } from '@/lib/appUrl';

const PLATFORMS = ['instagram', 'facebook', 'x', 'youtube', 'tiktok', 'linkedin'];
const DOW = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الإثنين' }, { en: 'Tue', ar: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء' }, { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
];

// Agency-side: publish a material now, or schedule it for a date, on a platform.
//  - now=true            -> status 'published', publishAt = now
//  - publishAt provided  -> status 'approved' (scheduled), publishAt = that date
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canUpload(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, clientId: true, title: true } });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const data = {};
  if (PLATFORMS.includes(b.platform)) data.platform = b.platform;

  const now = !!b.now;
  let when;
  if (now) {
    when = new Date();
    data.status = 'published';
  } else if (b.publishAt) {
    const dt = new Date(b.publishAt);
    if (Number.isNaN(dt.getTime())) return NextResponse.json({ error: 'bad-date' }, { status: 400 });
    when = dt;
    data.status = 'approved'; // scheduled
  } else {
    return NextResponse.json({ error: 'no-when' }, { status: 400 });
  }
  data.publishAt = when;
  data.dayEn = DOW[when.getDay()].en;
  data.dayAr = DOW[when.getDay()].ar;

  await prisma.post.update({ where: { id: post.id }, data });

  const payload = now
    ? { type: 'publish', titleEn: `<b>${post.title}</b> was published`, titleAr: `تم نشر <b>${post.title}</b>`, link: appBaseUrl() + `/posts/${post.id}` }
    : { type: 'system', titleEn: `<b>${post.title}</b> was scheduled`, titleAr: `تمت جدولة <b>${post.title}</b> للنشر`, link: appBaseUrl() + `/posts/${post.id}` };
  Promise.resolve()
    .then(() => notifyClientUsers(post.clientId, user.id, payload))
    .catch((e) => console.error('notify(publish) failed:', e.message));

  return NextResponse.json({ ok: true });
}
