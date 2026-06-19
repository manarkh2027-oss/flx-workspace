'use client';
import { useState } from 'react';
import { toast } from '@/lib/toast';

export default function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (next.length < 6) { toast('كلمة المرور الجديدة ٦ أحرف على الأقل', 'warn'); return; }
    if (next !== confirm) { toast('كلمتا المرور غير متطابقتين', 'warn'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'تعذّر تغيير كلمة المرور');
      toast('تم تغيير كلمة المرور ✓', 'success');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      toast(err.message || 'تعذّر تغيير كلمة المرور', 'warn');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card scard" id="password">
      <h2 data-ar="كلمة المرور">Password</h2>
      <div className="sub" data-ar="غيّر كلمة مرورك بشكل دوري للحفاظ على أمان حسابك">Change your password regularly to keep your account secure</div>
      <div className="field" style={{ maxWidth: 360 }}>
        <label data-ar="كلمة المرور الحالية">Current password</label>
        <input className="input" type="password" dir="ltr" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="grid2">
        <div className="field">
          <label data-ar="كلمة المرور الجديدة">New password</label>
          <input className="input" type="password" dir="ltr" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="field">
          <label data-ar="تأكيد كلمة المرور">Confirm password</label>
          <input className="input" type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary btn-sm" type="button" onClick={save} disabled={saving}>
          <i className="ti ti-lock" /> {saving ? <span data-ar="جارٍ الحفظ…">Saving…</span> : <span data-ar="تحديث كلمة المرور">Update password</span>}
        </button>
      </div>
    </div>
  );
}
