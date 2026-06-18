import nodemailer from 'nodemailer';

// Cached transporter. If SMTP_HOST is set we use real SMTP; otherwise we spin up
// a real, viewable Ethereal test inbox so email works with zero configuration.
let cached = null;

async function getTransport() {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    cached = { transporter, isEthereal: false, from: process.env.MAIL_FROM || 'FLX Workspace <no-reply@flx.local>' };
  } else {
    const acc = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: acc.user, pass: acc.pass },
    });
    cached = { transporter, isEthereal: true, from: process.env.MAIL_FROM || 'FLX Workspace <demo@flx.test>' };
  }
  return cached;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return { ok: false, reason: 'no recipient' };
  try {
    const { transporter, isEthereal, from } = await getTransport();
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return {
      ok: true,
      isEthereal,
      previewUrl: isEthereal ? nodemailer.getTestMessageUrl(info) : null,
      messageId: info.messageId,
    };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export function emailMode() {
  return process.env.SMTP_HOST ? 'smtp' : 'ethereal-test';
}
