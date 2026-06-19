'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

const QUICK = [
  { ar: 'تم الاستلام', en: 'Received' },
  { ar: 'جاري التعديل', en: 'Working on it' },
  { ar: 'في التنفيذ', en: 'In progress' },
];

// Agency-side reply to the client on a piece of content. Sends a comment
// (which notifies the client) via quick canned phrases or a free-text note.
export default function AgencyReply({ postId }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function reply(body) {
    const msg = String(body || '').trim();
    if (!msg || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: msg }),
      });
      if (!res.ok) throw new Error();
      toast('أُرسل ردّك إلى الزبون مع إشعار ✓', 'success');
      setText('');
      router.refresh();
    } catch { toast('تعذّر إرسال الرد', 'error'); }
    setBusy(false);
  }

  return (
    <div className="agency-reply">
      <div className="ar-title" data-ar="الرد على الزبون (يصله إشعار مباشرة)">Reply to the client (sends them a notification)</div>
      <div className="ar-quick">
        {QUICK.map((q) => (
          <button key={q.en} type="button" className="chip" disabled={busy} onClick={() => reply(q.ar)}>
            <span data-ar={q.ar}>{q.en}</span>
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <input className="input" dir="auto" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') reply(text); }}
          placeholder="اكتب رداً مخصصاً…" data-ar-ph="اكتب رداً مخصصاً…" />
        <button className="btn btn-primary btn-sm" type="button" disabled={busy || !text.trim()} onClick={() => reply(text)}>
          <i className="ti ti-send" /> <span data-ar="إرسال">Send</span>
        </button>
      </div>
    </div>
  );
}
