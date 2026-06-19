import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';

const ALLOWED = ['instagram', 'facebook', 'x', 'youtube', 'tiktok', 'linkedin'];

// The CLIENT (or agency) sets which platforms they want this material published
// on. This is only a request/preference — it does NOT publish or schedule.
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, clientId: true } });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));
  const list = Array.isArray(b.platforms)
    ? [...new Set(b.platforms.filter((p) => ALLOWED.includes(p)))]
    : [];

  await prisma.post.update({ where: { id: post.id }, data: { platforms: JSON.stringify(list) } });
  return NextResponse.json({ ok: true, platforms: list });
}
