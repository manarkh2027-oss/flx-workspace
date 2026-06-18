import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleClientIds, ACTIVE_CLIENT_COOKIE } from '@/lib/access';
import { isClient } from '@/lib/permissions';

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || isClient(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { clientId } = await req.json().catch(() => ({}));
  const ids = await getAccessibleClientIds(user);
  if (!ids.includes(clientId)) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTIVE_CLIENT_COOKIE, clientId, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
