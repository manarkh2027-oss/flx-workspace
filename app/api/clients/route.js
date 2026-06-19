import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';

const EMPTY_BRAND = JSON.stringify({ colors: [], fonts: [], voiceOk: [], voiceNo: [], gallery: [] });

function deriveInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ن';
  return parts.slice(0, 2).map((p) => p[0]).join('').slice(0, 4);
}

// Agency-side: create a brand-new client (subscriber) — a full workspace plus
// a login for that client. Everything else (home, calendar, brand, archive)
// is driven by this Client record, so the new client gets a complete page.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManageClients(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().slice(0, 120);
  const nameAr = String(b.nameAr || '').trim().slice(0, 120) || null;
  const initials = (String(b.initials || '').trim() || deriveInitials(nameAr || name)).slice(0, 4);
  const logoUrl = typeof b.logoUrl === 'string' && b.logoUrl.trim() ? b.logoUrl.trim() : null;
  const username = String(b.username || '').trim().toLowerCase();
  const password = String(b.password || '');
  const fullName = String(b.fullName || '').trim().slice(0, 80) || nameAr || name;

  if (!name) return NextResponse.json({ error: 'اكتب اسم المشترك' }, { status: 400 });
  if (!/^[a-z0-9_.-]{3,}$/.test(username)) {
    return NextResponse.json({ error: 'اسم المستخدم: حروف إنجليزية/أرقام، ٣ خانات على الأقل' }, { status: 400 });
  }
  if (password.length < 6) return NextResponse.json({ error: 'كلمة المرور ٦ أحرف على الأقل' }, { status: 400 });

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) return NextResponse.json({ error: 'اسم المستخدم محجوز، اختر غيره' }, { status: 409 });

  const client = await prisma.client.create({
    data: {
      workspaceId: user.workspaceId,
      name, nameAr, initials,
      logoUrl,
      brandJson: EMPTY_BRAND,
    },
  });

  await prisma.user.create({
    data: {
      workspaceId: user.workspaceId,
      clientId: client.id,
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      fullName,
      role: 'client',
      email: b.email ? String(b.email).trim().slice(0, 120) : null,
    },
  });

  return NextResponse.json({ ok: true, id: client.id });
}
