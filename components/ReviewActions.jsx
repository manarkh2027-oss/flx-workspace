'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function ReviewActions({ postId }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');

  async function act(status) {
    setBusy(status);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(status === 'approved' ? 'تم الاعتماد ✓' : 'تم إرسال طلب التعديل ✓', 'success');
      router.refresh();
    } catch {
      toast('تعذّر تنفيذ الإجراء — حاول مجدداً', 'error');
    }
    setBusy('');
  }

  return (
    <div className="acts">
      <button className="btn" type="button" disabled={!!busy} onClick={() => act('revision')}>
        <i className={'ti ' + (busy === 'revision' ? 'ti-loader-2' : 'ti-rotate')} /> <span data-ar="طلب تعديل">Request revision</span>
      </button>
      <button className="btn btn-approve" type="button" disabled={!!busy} onClick={() => act('approved')}>
        <i className={'ti ' + (busy === 'approved' ? 'ti-loader-2' : 'ti-check')} /> <span data-ar="اعتماد">Approve</span>
      </button>
    </div>
  );
}
