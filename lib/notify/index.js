import { prisma } from '@/lib/db';
import { sendEmail } from './email';
import { sendWhatsapp } from './whatsapp';
import { emailTemplate, plainText } from './templates';

// Deliver one notification to one user across every enabled channel:
// in-app (always) + email + WhatsApp.
export async function notifyUser(user, { type, titleEn, titleAr, bucket = 'today', link }) {
  if (!user) return { ok: false };

  // 1) in-app record (always)
  await prisma.notification.create({
    data: { userId: user.id, type, titleEn, titleAr, bucket, read: false },
  });

  const results = { inApp: true, email: null, whatsapp: null };

  // 2) email
  if (user.notifyEmail && user.email) {
    results.email = await sendEmail({
      to: user.email,
      subject: 'FLX Workspace — إشعار جديد',
      html: emailTemplate({ name: user.fullName, bodyAr: titleAr, bodyEn: titleEn, link }),
      text: plainText({ bodyAr: titleAr, bodyEn: titleEn }),
    });
  }

  // 3) WhatsApp
  if (user.notifyWhatsapp && user.phone) {
    results.whatsapp = await sendWhatsapp({ to: user.phone, body: plainText({ bodyAr: titleAr, bodyEn: titleEn }) });
  }

  return { ok: true, results };
}

// Notify the client-side owners of a client (e.g. when the agency posts/comments).
export async function notifyClientUsers(clientId, exceptUserId, payload) {
  if (!clientId) return;
  const users = await prisma.user.findMany({
    where: { clientId, role: 'client', NOT: { id: exceptUserId || undefined } },
  });
  await Promise.allSettled(users.map((u) => notifyUser(u, payload)));
}

// Notify the agency side (account managers + admins) — e.g. when a client approves.
export async function notifyAgency(workspaceId, exceptUserId, payload) {
  if (!workspaceId) return;
  const users = await prisma.user.findMany({
    where: { workspaceId, role: { in: ['account_manager', 'super_admin'] }, NOT: { id: exceptUserId || undefined } },
  });
  await Promise.allSettled(users.map((u) => notifyUser(u, payload)));
}
