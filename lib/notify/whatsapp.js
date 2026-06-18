// WhatsApp delivery via the Meta WhatsApp Cloud API.
// Activates automatically once WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set.

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsapp({ to, body }) {
  if (!to) return { ok: false, reason: 'no phone number' };
  if (!whatsappConfigured()) {
    return { ok: false, skipped: true, reason: 'WhatsApp not configured (add credentials in .env)' };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const to_ = String(to).replace(/[^\d]/g, ''); // E.164 digits only

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to_,
        type: 'text',
        text: { preview_url: false, body },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
