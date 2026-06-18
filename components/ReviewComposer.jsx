'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function ReviewComposer({ postId }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error();
      setBody('');
      toast('تم إرسال التعليق ✓', 'success');
      router.refresh();
    } catch {
      toast('تعذّر إرسال التعليق', 'error');
    }
    setBusy(false);
  }

  return (
    <div className="composer">
      <div className="box">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }}
          placeholder="Add a comment…  (Ctrl+Enter to send)"
          data-ar-ph="أضف تعليقاً…  (Ctrl+Enter للإرسال)"
        />
        <div className="tools">
          <button className="btn btn-primary btn-sm" type="button" disabled={busy || !body.trim()} onClick={send}>
            <i className="ti ti-send" /> <span data-ar="إرسال">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
