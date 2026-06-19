'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

// Compact approve / request-revision controls shown UNDER a post card.
// For client (and other approver) roles.
export default function CardActions({ postId, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState('');

  async function send(newStatus, body) {
    setBusy(newStatus);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: body }),
      });
      if (!res.ok) throw new Error();
      toast(newStatus === 'approved' ? 'تم اعتماد المادة ✓' : 'أُرسل طلب التعديل إلى الفريق ✓', 'success');
      setRevising(false); setNote('');
      router.refresh();
    } catch { toast('تعذّر تنفيذ الطلب — حاول مجدداً', 'error'); }
    setBusy('');
  }

  if (status === 'approved' || status === 'published') {
    return (
      <div className="card-acts done">
        <span className="ok"><i className="ti ti-circle-check" /> <span data-ar="معتمدة للنشر">Approved for publishing</span></span>
      </div>
    );
  }

  if (revising) {
    return (
      <div className="card-acts col">
        <textarea className="input" style={{ height: 70, paddingTop: 8, resize: 'vertical' }} dir="auto"
          value={note} onChange={(e) => setNote(e.target.value)} autoFocus
          placeholder="اكتب التعديل المطلوب…" data-ar-ph="اكتب التعديل المطلوب…" />
        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" type="button" onClick={() => { setRevising(false); setNote(''); }} data-ar="إلغاء">Cancel</button>
          <button className="btn btn-primary btn-sm" type="button" disabled={busy === 'revision' || !note.trim()} onClick={() => send('revision', note)}>
            <i className="ti ti-send" /> <span data-ar="إرسال للفريق">Send</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-acts">
      <button className="btn btn-sm" type="button" disabled={!!busy} onClick={() => setRevising(true)}>
        <i className="ti ti-rotate" /> <span data-ar="طلب تعديل">Request revision</span>
      </button>
      <button className="btn btn-approve btn-sm" type="button" disabled={!!busy} onClick={() => send('approved')}>
        <i className={'ti ' + (busy === 'approved' ? 'ti-loader-2' : 'ti-check')} /> <span data-ar="اعتماد">Approve</span>
      </button>
    </div>
  );
}
