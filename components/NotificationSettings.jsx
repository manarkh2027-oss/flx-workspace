'use client';
import { useState } from 'react';

export default function NotificationSettings({ initial, whatsappReady }) {
  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [notifyEmail, setNotifyEmail] = useState(initial.notifyEmail);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initial.notifyWhatsapp);
  const [savedMsg, setSavedMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  async function save() {
    setSavedMsg('');
    await fetch('/api/notify/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, notifyEmail, notifyWhatsapp }),
    });
    setSavedMsg('saved');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  async function sendTest() {
    setTesting(true);
    setResult(null);
    await save();
    try {
      const res = await fetch('/api/notify/test', { method: 'POST' });
      setResult(await res.json());
    } catch {
      setResult({ error: true });
    }
    setTesting(false);
  }

  return (
    <div className="card scard">
      <h2 data-ar="الإشعارات (بريد + واتساب)">Notifications (email + WhatsApp)</h2>
      <div className="sub" data-ar="نُرسل لك إشعاراً فعلياً عند كل اعتماد أو تعليق أو طلب تعديل">We send you a real alert on every approval, comment and revision request</div>

      <div className="grid2">
        <div className="field">
          <label data-ar="البريد الإلكتروني">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label data-ar="رقم واتساب (دولي)">WhatsApp number (international)</label>
          <input className="input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+970590000000" />
        </div>
      </div>

      <div className="frow" style={{ marginTop: 6 }}>
        <div><div className="lab" data-ar="إشعارات البريد">Email notifications</div></div>
        <label className="switch"><input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} /><span className="track" /><span className="thumb" /></label>
      </div>
      <div className="frow">
        <div>
          <div className="lab" data-ar="إشعارات واتساب">WhatsApp notifications</div>
          <div className="desc" data-ar={whatsappReady ? 'مُفعّل ✓' : 'يتطلب ربط حساب واتساب للأعمال (WHATSAPP_TOKEN في .env)'}>
            {whatsappReady ? 'Connected ✓' : 'Needs a WhatsApp Business account (WHATSAPP_TOKEN in .env)'}
          </div>
        </div>
        <label className="switch"><input type="checkbox" checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} /><span className="track" /><span className="thumb" /></label>
      </div>

      <div className="row" style={{ gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary btn-sm" type="button" onClick={save}><i className="ti ti-check" /> <span data-ar="حفظ">Save</span></button>
        <button className="btn btn-sm" type="button" onClick={sendTest} disabled={testing}>
          <i className="ti ti-send" /> {testing ? <span data-ar="جارٍ الإرسال…">Sending…</span> : <span data-ar="إرسال إشعار تجريبي">Send a test notification</span>}
        </button>
        {savedMsg && <span className="hint" style={{ color: 'var(--green-ink)', fontSize: 12.5 }} data-ar="تم الحفظ ✓">Saved ✓</span>}
      </div>

      {result && (
        <div className="test-result">
          <div className="tr-row">
            <i className={'ti ' + (result.email?.ok ? 'ti-circle-check' : 'ti-alert-circle')} style={{ color: result.email?.ok ? 'var(--green)' : 'var(--amber)' }} />
            <span>
              {result.email?.ok
                ? (result.email.previewUrl
                    ? <>تم إرسال البريد فعلياً — <a href={result.email.previewUrl} target="_blank" rel="noreferrer" className="link">افتح الرسالة</a> (صندوق اختبار)</>
                    : <>تم إرسال البريد إلى <b>{email}</b> ✓</>)
                : <>البريد: {result.email?.reason || 'تعذّر الإرسال'}</>}
            </span>
          </div>
          <div className="tr-row">
            <i className={'ti ' + (result.whatsapp?.ok ? 'ti-brand-whatsapp' : 'ti-brand-whatsapp')} style={{ color: result.whatsapp?.ok ? 'var(--green)' : 'var(--ink-4)' }} />
            <span>
              {result.whatsapp?.ok
                ? <>تم إرسال رسالة واتساب فعلياً ✓</>
                : <>واتساب: {result.whatsapp?.reason || 'غير مُفعّل'}</>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
