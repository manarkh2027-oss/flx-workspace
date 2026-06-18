import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { username, password } = body || {};
  if (!username || !password) {
    return NextResponse.json({ error: 'missing credentials' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: String(username).trim() } });
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return NextResponse.json(
      { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
      { status: 401 }
    );
  }

  const token = await signSession({ sub: user.id, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
