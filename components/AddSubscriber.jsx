'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { fileToDataUrl, imageErrorAr } from '@/lib/image';

// Agency-side: create a new client (subscriber) with a full workspace + login.
export default function AddSubscriber() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [logo, setLogo] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  function close() {
    setOpen(false);
    setName(''); setNameAr(''); setLogo(''); setUsername(''); setPassword(''); setEmail('');
  }

  async function onPickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setLogo(await fileToDataUrl(file, { maxSize: 640 })); }
    catch (err) { toast(imageErrorAr(err), 'warn'); }
  }

  async function submit() {
    if (!name.trim()) { toast('اكتب اسم المشترك', 'warn'); return; }
    if (username.trim().length < 3) { toast('اسم المستخدم ٣ خانات على الأقل', 'warn'); return; }
    if (password.length < 6) { toast('كلمة المرور ٦ أحرف على الأقل', 'warn'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameAr, logoUrl: logo || null, username, password, email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'failed');
      toast('تم إنشاء المشترك ✓ — يمكنه الدخول باسم المستخدم وكلمة المرور', 'success');
      close();
      router.push(`/subscribers/${j.id}`);
      router.refresh();
    } catch (err) {
      toast(err.message || 'تعذّر إنشاء المشترك', 'warn');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <i className="ti ti-user-plus" /> <span data-ar="إضافة مشترك">Add subscriber</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 data-ar="إضافة مشترك جديد">Add new subscriber</h3>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close"><i className="ti ti-x" /></button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label data-ar="شعار المشترك (اختياري)">Logo (optional)</label>
                <div className="row" style={{ gap: 12 }}>
                  {logo
                    ? <img className="sub-logo" src={logo} alt="" />
                    : <span className="sub-logo ph">{(nameAr || name || 'ن').trim()[0] || 'ن'}</span>}
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={onPickLogo} />
                  <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                    <i className="ti ti-upload" /> <span data-ar={logo ? 'تغيير' : 'رفع شعار'}>{logo ? 'Change' : 'Upload'}</span>
                  </button>
                  {logo && <button type="button" className="btn btn-sm" style={{ color: 'var(--red-ink)' }} onClick={() => setLogo('')} data-ar="حذف">Remove</button>}
                </div>
              </div>

              <div className="grid2">
                <div className="field"><label data-ar="اسم المشترك (عربي)">Name (AR)</label><input className="input" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مطاعم السلطان" data-ar-ph="مثال: مطاعم السلطان" /></div>
                <div className="field"><label data-ar="الاسم (إنجليزي)">Name (EN)</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sultan Restaurants" /></div>
              </div>

              <div className="set-divider"><span data-ar="بيانات دخول المشترك">Subscriber login</span></div>

              <div className="grid2">
                <div className="field"><label data-ar="اسم المستخدم">Username</label><input className="input" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sultan" /></div>
                <div className="field"><label data-ar="كلمة المرور">Password</label><input className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="٦ أحرف على الأقل" data-ar-ph="٦ أحرف على الأقل" /></div>
              </div>
              <div className="field"><label data-ar="البريد الإلكتروني (اختياري — للإشعارات)">Email (optional — for notifications)</label><input className="input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" /></div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-sm" onClick={close} disabled={saving} data-ar="إلغاء">Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
                <i className={'ti ' + (saving ? 'ti-loader-2' : 'ti-user-plus')} /> {saving ? <span data-ar="جارٍ الإنشاء…">Creating…</span> : <span data-ar="إنشاء المشترك">Create</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
