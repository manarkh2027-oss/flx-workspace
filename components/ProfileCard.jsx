'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initialsOf } from '@/lib/ui';
import { toast } from '@/lib/toast';
import { fileToDataUrl, imageErrorAr } from '@/lib/image';

export default function ProfileCard({ initial, roleLabel }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToDataUrl(file, { maxSize: 320 });
      setAvatarUrl(url);
    } catch (err) {
      toast(imageErrorAr(err), 'warn');
    }
  }

  async function save() {
    if (!fullName.trim()) { toast('الاسم لا يمكن أن يكون فارغاً', 'warn'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, avatarUrl: avatarUrl || null }),
      });
      if (!res.ok) throw new Error();
      toast('تم حفظ الملف الشخصي ✓', 'success');
      router.refresh();
    } catch {
      toast('تعذّر حفظ الملف الشخصي', 'warn');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card scard" id="profile">
      <h2 data-ar="الملف الشخصي">Profile</h2>
      <div className="sub" data-ar="معلوماتك الأساسية كما تظهر للفريق">Your basic information as the team sees it</div>
      <div className="prof">
        {avatarUrl
          ? <img className="avatar a4" src={avatarUrl} alt="" style={{ objectFit: 'cover' }} />
          : <span className="avatar a4">{initialsOf(fullName)}</span>}
        <div className="col" style={{ gap: 8 }}>
          <span className="badge badge--brand" style={{ height: 24, width: 'fit-content' }} data-ar={roleLabel.ar}>{roleLabel.en}</span>
          <div className="row" style={{ gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            <button className="btn btn-sm" type="button" onClick={() => fileRef.current?.click()}>
              <i className="ti ti-upload" /> <span data-ar={avatarUrl ? 'استبدال الصورة' : 'تغيير الصورة'}>{avatarUrl ? 'Replace photo' : 'Change photo'}</span>
            </button>
            {avatarUrl && (
              <button className="btn btn-sm" type="button" style={{ color: 'var(--red-ink)' }} onClick={() => setAvatarUrl('')}>
                <i className="ti ti-trash" /> <span data-ar="حذف">Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid2">
        <div className="field"><label data-ar="الاسم الكامل">Full name</label><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="field"><label data-ar="اسم المستخدم">Username</label><input className="input" defaultValue={initial.username} readOnly /></div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary btn-sm" type="button" onClick={save} disabled={saving}>
          <i className="ti ti-check" /> {saving ? <span data-ar="جارٍ الحفظ…">Saving…</span> : <span data-ar="حفظ التغييرات">Save changes</span>}
        </button>
      </div>
    </div>
  );
}
