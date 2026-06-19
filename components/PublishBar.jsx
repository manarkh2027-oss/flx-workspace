'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORM_LIST, PLATFORM_AR } from '@/lib/ui';
import { toast } from '@/lib/toast';

// ADMIN/agency view, under a material: pick a platform → publish now or
// schedule; plus delete the material. Highlights the platforms the client requested.
export default function PublishBar({ postId, requested = [], platform, publishAt, status }) {
  const router = useRouter();
  const [pick, setPick] = useState(null);   // platform key being acted on
  const [date, setDate] = useState(publishAt ? String(publishAt).slice(0, 16) : '');
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  async function publish(now) {
    if (!now && !date) { toast('اختر تاريخ الجدولة', 'warn'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: pick, now, publishAt: now ? null : date }),
      });
      if (!res.ok) throw new Error();
      toast(now ? `تم نشر المادة على ${PLATFORM_AR[pick] || pick} ✓` : `تمت جدولة المادة على ${PLATFORM_AR[pick] || pick} ✓`, 'success');
      setPick(null);
      router.refresh();
    } catch { toast('تعذّر تنفيذ العملية', 'error'); }
    setBusy(false);
  }

  async function del() {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('تم حذف المادة ✓', 'success');
      router.refresh();
    } catch { toast('تعذّر حذف المادة', 'error'); setBusy(false); }
  }

  const scheduled = publishAt && (status === 'approved' || status === 'published');
  const dateStr = publishAt ? new Date(publishAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="publish-bar">
      <div className="pb-row">
        <div className="plat-row">
          {PLATFORM_LIST.map((p) => (
            <button key={p.key} type="button" title={'النشر على ' + p.ar}
              className={'plat-ic' + (requested.includes(p.key) ? ' req' : '') + (pick === p.key ? ' active' : '')}
              onClick={() => setPick(pick === p.key ? null : p.key)}>
              <i className={'ti ' + p.icon} />
            </button>
          ))}
        </div>
        <button type="button" className="plat-ic del" title="حذف المادة" onClick={() => setConfirmDel(true)}>
          <i className="ti ti-trash" />
        </button>
      </div>

      {requested.length > 0 && (
        <div className="pb-requested" data-ar={`طلب الزبون: ${requested.map((k) => PLATFORM_AR[k] || k).join('، ')}`}>
          {`Client wants: ${requested.join(', ')}`}
        </div>
      )}

      {scheduled && (
        <div className="pb-sched">
          <i className={'ti ' + (status === 'published' ? 'ti-circle-check' : 'ti-calendar-clock')} />
          <span data-ar={status === 'published' ? `منشورة${platform ? ' على ' + (PLATFORM_AR[platform] || platform) : ''}` : `مجدولة ${dateStr}${platform ? ' · ' + (PLATFORM_AR[platform] || platform) : ''}`}>
            {status === 'published' ? 'Published' : `Scheduled ${dateStr}`}
          </span>
        </div>
      )}

      {pick && (
        <div className="pb-actions">
          <div className="pb-on" data-ar={`النشر على ${PLATFORM_AR[pick] || pick}`}>{`Publish on ${pick}`}</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-approve btn-sm" disabled={busy} onClick={() => publish(true)}>
              <i className="ti ti-send" /> <span data-ar="نشر فوري">Publish now</span>
            </button>
            <input className="input input-sm" type="datetime-local" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 200 }} />
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => publish(false)}>
              <i className="ti ti-calendar-plus" /> <span data-ar="جدولة">Schedule</span>
            </button>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setPick(null)} data-ar="إلغاء">Cancel</button>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-overlay" onClick={() => !busy && setConfirmDel(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3 data-ar="حذف المادة؟">Delete material?</h3>
              <button type="button" className="icon-btn" onClick={() => !busy && setConfirmDel(false)}><i className="ti ti-x" /></button>
            </div>
            <div className="modal-body">
              <div className="confirm-danger">
                <span className="ic"><i className="ti ti-alert-triangle" /></span>
                <div><div className="t" data-ar="سيتم حذف هذه المادة نهائياً">This material will be permanently deleted</div>
                  <div className="d" data-ar="لا يمكن التراجع عن هذا الإجراء.">This action cannot be undone.</div></div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDel(false)} disabled={busy} data-ar="إلغاء">Cancel</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={del} disabled={busy}>
                <i className={'ti ' + (busy ? 'ti-loader-2' : 'ti-trash')} /> <span data-ar="نعم، احذف">Yes, delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
