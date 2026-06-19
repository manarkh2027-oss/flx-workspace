'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

// Delete a client with an explicit confirmation step.
export default function DeleteClient({ clientId, clientName, clientNameAr }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('تم حذف العميل وكل مواده ✓', 'success');
      router.push('/subscribers');
      router.refresh();
    } catch {
      toast('تعذّر حذف العميل', 'error');
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-sm" style={{ color: 'var(--red-ink)' }} onClick={() => setOpen(true)}>
        <i className="ti ti-trash" /> <span data-ar="حذف العميل">Delete client</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !busy && setOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 data-ar="تأكيد حذف العميل">Delete client?</h3>
              <button type="button" className="icon-btn" onClick={() => !busy && setOpen(false)} aria-label="Close"><i className="ti ti-x" /></button>
            </div>
            <div className="modal-body">
              <div className="confirm-danger">
                <span className="ic"><i className="ti ti-alert-triangle" /></span>
                <div>
                  <div className="t" data-ar={`هل أنت متأكد من حذف «${clientNameAr || clientName}»؟`}>{`Delete "${clientName}"?`}</div>
                  <div className="d" data-ar="سيُحذف العميل نهائياً مع كل مواده وحملاته وحساب دخوله. لا يمكن التراجع.">This permanently removes the client with all its materials, campaigns and login. This cannot be undone.</div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-sm" onClick={() => setOpen(false)} disabled={busy} data-ar="إلغاء">Cancel</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={confirmDelete} disabled={busy}>
                <i className={'ti ' + (busy ? 'ti-loader-2' : 'ti-trash')} /> {busy ? <span data-ar="جارٍ الحذف…">Deleting…</span> : <span data-ar="نعم، احذف العميل">Yes, delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
