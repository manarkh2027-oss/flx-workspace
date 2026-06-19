import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getActiveClientId, canAccessClient } from '@/lib/access';
import { canUpload } from '@/lib/permissions';
import { notifyClientUsers } from '@/lib/notify';
import { appBaseUrl } from '@/lib/appUrl';

const TYPES = ['video', 'image', 'design', 'copy'];
const PLATFORMS = ['instagram', 'facebook', 'x', 'youtube', 'tiktok'];
const DOW = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الإثنين' }, { en: 'Tue', ar: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء' }, { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
];

// Agency-side: create a new piece of content ("material") for a client.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canUpload(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));

  const clientId = String(b.clientId || '') || (await getActiveClientId(user));
  if (!clientId || !(await canAccessClient(user, clientId))) {
    return NextResponse.json({ error: 'forbidden-client' }, { status: 403 });
  }

  const type = TYPES.includes(b.type) ? b.type : null;
  const title = String(b.title || '').trim().slice(0, 160);
  if (!type) return NextResponse.json({ error: 'bad-type' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'no-title' }, { status: 400 });

  const platform = PLATFORMS.includes(b.platform) ? b.platform : 'instagram';
  const body = String(b.body || '').trim().slice(0, 5000) || null;
  const mediaUrl = typeof b.mediaUrl === 'string' && b.mediaUrl.trim() ? b.mediaUrl.trim() : null;

  // Optional schedule date → derive the localized weekday label used on the board.
  let publishAt = null, dayEn = null, dayAr = null;
  if (b.publishAt) {
    const dt = new Date(b.publishAt);
    if (!Number.isNaN(dt.getTime())) {
      publishAt = dt;
      dayEn = DOW[dt.getDay()].en;
      dayAr = DOW[dt.getDay()].ar;
    }
  }

  const post = await prisma.post.create({
    data: {
      clientId, title, titleAr: title, type, platform,
      status: 'review', version: 1, body, mediaUrl, publishAt, dayEn, dayAr,
    },
  });

  // Tell the client a new piece is waiting for their review.
  const payload = {
    type: 'approval',
    titleEn: `<b>${user.fullName}</b> uploaded <b>${title}</b> for your review`,
    titleAr: `<b>${user.fullName}</b> رفع <b>${title}</b> بانتظار مراجعتك`,
    link: appBaseUrl() + `/posts/${post.id}`,
  };
  Promise.resolve()
    .then(() => notifyClientUsers(clientId, user.id, payload))
    .catch((e) => console.error('notify(new material) failed:', e.message));

  return NextResponse.json({ ok: true, id: post.id });
}
