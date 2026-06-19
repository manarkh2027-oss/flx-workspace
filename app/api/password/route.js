import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Change the current user's own password (requires the current password).
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const current = String(b.current || '');
  const next = String(b.next || '');

  if (!bcrypt.compareSync(current, user.passwordHash)) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور الجديدة قصيرة جداً (٦ أحرف على الأقل)' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: bcrypt.hashSync(next, 10) },
  });
  return NextResponse.json({ ok: true });
}
