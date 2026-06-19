import nodemailer from 'nodemailer';

// Cached transporter. If SMTP_HOST is set we use real SMTP; otherwise we spin up
// a real, viewable Ethereal test inbox so email works with zero configuration.
let cached = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error((label || 'operation') + ' timed out')), ms)),
  ]);
}

const TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 8000, socketTimeout: 12000 };

async function getTransport() {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      ...TIMEOUTS,
    });
    cached = { transporter, isEthereal: false, from: process.env.MAIL_FROM || 'FLX Workspace <no-reply@flx.local>' };
  } else {
    const acc = await withTimeout(nodemailer.createTestAccount(), 10000, 'createTestAccount');
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: acc.user, pass: acc.pass }, ...TIMEOUTS,
    });
    cached = { transporter, isEthereal: true, from: process.env.MAIL_FROM || 'FLX Workspace <demo@flx.test>' };
  }
  return cached;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return { ok: false, reason: 'no recipient' };
  try {
    const { transporter, isEthereal, from } = await withTimeout(getTransport(), 11000, 'getTransport');
    const info = await withTimeout(transporter.sendMail({ from, to, subject, html, text }), 14000, 'sendMail');
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
