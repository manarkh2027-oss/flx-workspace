import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail, emailMode } from '@/lib/notify/email';
import { sendWhatsapp, whatsappConfigured } from '@/lib/notify/whatsapp';
import { emailTemplate, plainText } from '@/lib/notify/templates';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const titleAr = 'هذا إشعار تجريبي من FLX Workspace — كل شيء يعمل بنجاح! 🎉';
  const titleEn = 'This is a test notification from FLX Workspace — everything works!';

  const out = {
    emailMode: emailMode(),
    whatsappConfigured: whatsappConfigured(),
    email: null,
    whatsapp: null,
  };

  if (user.notifyEmail && user.email) {
    out.email = await sendEmail({
      to: user.email,
      subject: 'FLX Workspace — إشعار تجريبي',
      html: emailTemplate({ name: user.fullName, bodyAr: titleAr, bodyEn: titleEn }),
      text: plainText({ bodyAr: titleAr, bodyEn: titleEn }),
    });
  } else {
    out.email = { ok: false, reason: user.email ? 'email notifications are off' : 'no email on your profile' };
  }

  if (user.notifyWhatsapp && user.phone) {
    out.whatsapp = await sendWhatsapp({ to: user.phone, body: plainText({ bodyAr: titleAr, bodyEn: titleEn }) });
  } else {
    out.whatsapp = { ok: false, skipped: true, reason: user.phone ? 'WhatsApp notifications are off' : 'no phone on your profile' };
  }

  return NextResponse.json(out);
}
