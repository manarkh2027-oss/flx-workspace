import { appBaseUrl } from '@/lib/appUrl';

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, '');
}

export function emailTemplate({ name, bodyAr, bodyEn, link }) {
  const url = link || appBaseUrl();
  const ar = bodyAr || bodyEn || '';
  const en = bodyEn || bodyAr || '';
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;background:#f3f3f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f6;padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8ee;">
        <tr><td style="background:linear-gradient(120deg,#9A2F9E,#D2458C 52%,#F4836E);padding:22px 28px;">
          <span style="color:#fff;font-size:18px;font-weight:600;letter-spacing:.3px;">FLX&nbsp;Workspace</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 14px;color:#16161a;font-size:16px;font-weight:600;">مرحباً ${name || ''}،</p>
          <p style="margin:0 0 6px;color:#16161a;font-size:15px;line-height:1.7;">${ar}</p>
          <p dir="ltr" style="margin:0 0 22px;color:#8c8c97;font-size:13px;line-height:1.6;">${en}</p>
          <a href="${url}" style="display:inline-block;background:#C2388F;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:10px;">فتح مساحة العمل</a>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f0f0f3;color:#b7b7c0;font-size:12px;">
          FLX Creative Production · We Fill What's Missing
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function plainText({ bodyAr, bodyEn }) {
  return `FLX Workspace\n${stripTags(bodyAr || bodyEn)}`;
}
