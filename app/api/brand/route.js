import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getActiveClientId, canAccessClient } from '@/lib/access';
import { canEditBrand } from '@/lib/permissions';

// Persist edits to the Brand Hub: logo, client display name, and the
// colours / fonts / voice-keywords stored in Client.brandJson.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canEditBrand(user.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const clientId = await getActiveClientId(user);
  if (!clientId || !(await canAccessClient(user, clientId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const data = {};

  // Logo: a data-URL / path string to set, or null to remove.
  if ('logoUrl' in b) {
    const v = b.logoUrl;
    data.logoUrl = typeof v === 'string' && v.trim() ? v.trim() : null;
  }
  if (typeof b.name === 'string' && b.name.trim()) data.name = b.name.trim();
  if (typeof b.nameAr === 'string') data.nameAr = b.nameAr.trim() || null;
  if (typeof b.initials === 'string' && b.initials.trim()) data.initials = b.initials.trim().slice(0, 4);

  // brandJson is rebuilt from a sanitised structure to avoid storing junk.
  if (b.brand && typeof b.brand === 'object') {
    const s = b.brand;
    const clean = {
      colors: Array.isArray(s.colors) ? s.colors.slice(0, 12).map((c) => ({
        en: String(c.en || '').slice(0, 60),
        ar: String(c.ar || '').slice(0, 60),
        hex: String(c.hex || '#000000').slice(0, 9),
        rgb: String(c.rgb || '').slice(0, 30),
        cmyk: String(c.cmyk || '').slice(0, 30),
      })) : [],
      fonts: Array.isArray(s.fonts) ? s.fonts.slice(0, 8).map((f) => ({
        family: String(f.family || '').slice(0, 60),
        sample: String(f.sample || '').slice(0, 40),
        ar: !!f.ar,
        note_en: String(f.note_en || '').slice(0, 80),
        note_ar: String(f.note_ar || '').slice(0, 80),
      })) : [],
      voiceOk: Array.isArray(s.voiceOk) ? s.voiceOk.slice(0, 30).map((w) => String(w).slice(0, 40)).filter(Boolean) : [],
      voiceNo: Array.isArray(s.voiceNo) ? s.voiceNo.slice(0, 30).map((w) => String(w).slice(0, 40)).filter(Boolean) : [],
      gallery: Array.isArray(s.gallery) ? s.gallery.slice(0, 24).map((g) => ({
        url: String(g.url || ''),
        en: String(g.en || '').slice(0, 80),
        ar: String(g.ar || '').slice(0, 80),
      })).filter((g) => g.url) : [],
    };
    data.brandJson = JSON.stringify(clean);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing-to-update' }, { status: 400 });
  }

  await prisma.client.update({ where: { id: clientId }, data });
  return NextResponse.json({ ok: true });
}
