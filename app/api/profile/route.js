import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Update the current user's own profile: display name and avatar.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const data = {};

  if (typeof b.fullName === 'string' && b.fullName.trim()) {
    data.fullName = b.fullName.trim().slice(0, 80);
  }
  // avatarUrl: data-URL string to set, or null to remove.
  if ('avatarUrl' in b) {
    const v = b.avatarUrl;
    data.avatarUrl = typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing-to-update' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
