'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function ReviewActions({ postId }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState('');

  async function approve() {
    setBusy('approved');
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error();
      toast('تم اعتماد المحتوى ✓', 'success');
      router.refresh();
    } catch { toast('تعذّر الاعتماد — حاول مجدداً', 'error'); }
    setBusy('');
  }

  async function submitRevision() {
    if (!note.trim()) return;
    setBusy('revision');
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revision', note }),
      });
      if (!res.ok) throw new Error();
      toast('أُرسل طلب التعديل إلى فريق FLX ✓', 'success');
      setRevising(false);
      setNote('');
      router.refresh();
    } catch { toast('تعذّر إرسال الطلب — حاول مجدداً', 'error'); }
    setBusy('');
  }

  if (revising) {
    return (
      <div className="revision-box">
        <div className="revision-title" data-ar="ما التعديل المطلوب؟ سيصل ملاحظتك إلى فريق FLX">What needs to change? Your note goes to the FLX team</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اكتب ملاحظتك للفريق…"
          data-ar-ph="اكتب ملاحظتك للفريق…"
          autoFocus
        />
        <div className="revision-actions">
          <button className="btn btn-sm" type="button" onClick={() => { setRevising(false); setNote(''); }} data-ar="إلغاء">Cancel</button>
          <button className="btn btn-primary btn-sm" type="button" disabled={busy === 'revision' || !note.trim()} onClick={submitRevision}>
            <i className={'ti ' + (busy === 'revision' ? 'ti-loader-2' : 'ti-send')} /> <span data-ar="إرسال للفريق">Send to team</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="acts">
      <button className="btn" type="button" disabled={!!busy} onClick={() => setRevising(true)}>
        <i className="ti ti-rotate" /> <span data-ar="طلب تعديل">Request revision</span>
      </button>
      <button className="btn btn-approve" type="button" disabled={!!busy} onClick={approve}>
        <i className={'ti ' + (busy === 'approved' ? 'ti-loader-2' : 'ti-check')} /> <span data-ar="اعتماد">Approve</span>
      </button>
    </div>
  );
}
