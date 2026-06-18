'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function MarkAllReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch('/api/notifications/read', { method: 'POST' });
      if (!res.ok) throw new Error();
      toast('تم تحديد الكل كمقروء ✓', 'success');
      router.refresh();
    } catch {
      toast('تعذّر التحديث', 'error');
    }
    setBusy(false);
  }

  return (
    <button className="btn btn-sm" type="button" disabled={busy} onClick={go}>
      <i className="ti ti-checks" /> <span data-ar="تحديد الكل كمقروء">Mark all as read</span>
    </button>
  );
}
