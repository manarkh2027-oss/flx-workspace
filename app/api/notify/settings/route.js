import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: typeof b.email === 'string' ? (b.email.trim() || null) : user.email,
      phone: typeof b.phone === 'string' ? (b.phone.trim() || null) : user.phone,
      notifyEmail: typeof b.notifyEmail === 'boolean' ? b.notifyEmail : user.notifyEmail,
      notifyWhatsapp: typeof b.notifyWhatsapp === 'boolean' ? b.notifyWhatsapp : user.notifyWhatsapp,
    },
  });

  return NextResponse.json({ ok: true });
}
