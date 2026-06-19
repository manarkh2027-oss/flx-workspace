'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PLATFORM_LIST, PLATFORM, PLATFORM_AR } from '@/lib/ui';
import { toast } from '@/lib/toast';

const JOB_STATUS = {
  pending:    { ar: 'بالانتظار', en: 'Pending',    cls: 'badge--amber' },
  publishing: { ar: 'جارٍ النشر', en: 'Publishing', cls: 'badge--blue' },
  published:  { ar: 'تم النشر',  en: 'Published',  cls: 'badge--green' },
  failed:     { ar: 'فشل',       en: 'Failed',     cls: 'badge--red' },
  retry:      { ar: 'إعادة محاولة', en: 'Retry',   cls: 'badge--amber' },
};

const PIPELINE = [
  { icon: 'ti-file-check', ar: 'المحتوى جاهز' },
  { icon: 'ti-thumb-up', ar: 'موافقة العميل' },
  { icon: 'ti-send', ar: 'مركز النشر' },
  { icon: 'ti-apps', ar: 'اختيار المنصات' },
  { icon: 'ti-rocket', ar: 'نشر / جدولة' },
];

function ReadyItem({ post, connectedSet }) {
  const router = useRouter();
  const [sel, setSel] = useState(post.platforms || []);
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (k) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  async function go(now) {
    if (sel.length === 0) { toast('اختر منصة واحدة على الأقل', 'warn'); return; }
    if (!now && !when) { toast('حدّد موعد الجدولة', 'warn'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/publishing/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, platforms: sel, now, scheduledAt: now ? null : when }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'failed');
      if (now) {
        const ok = (j.results || []).filter((r) => r.ok).length;
        const fail = (j.results || []).length - ok;
        toast(`أُنشئت ${j.count} مهمة نشر — نجح ${ok}${fail ? `، فشل ${fail} (راجع السجلّ)` : ''}`, fail ? 'warn' : 'success');
      } else {
        toast(`تمت جدولة ${j.count} مهمة نشر ✓`, 'success');
      }
      router.refresh();
    } catch (e) { toast('تعذّر الإرسال: ' + (e.message || ''), 'error'); }
    setBusy(false);
  }

  return (
    <div className="ready-item">
      <div className="ri-head">
        <div className="ri-title"><i className="ti ti-file" /> <span data-ar={post.titleAr || undefined}>{post.title}</span></div>
        <span className="ri-client" data-ar={post.clientNameAr || undefined}>{post.clientName}</span>
      </div>
      <div className="plat-row">
        {PLATFORM_LIST.map((p) => {
          const on = sel.includes(p.key);
          const live = connectedSet.has(p.key);
          return (
            <button key={p.key} type="button" title={p.ar + (live ? '' : ' — غير مرتبط')}
              className={'plat-ic' + (on ? ' on' : '') + (!live ? ' dim' : '')} onClick={() => toggle(p.key)}>
              <i className={'ti ' + p.icon} />
            </button>
          );
        })}
      </div>
      <div className="ri-actions">
        <button className="btn btn-approve btn-sm" type="button" disabled={busy} onClick={() => go(true)}>
          <i className="ti ti-rocket" /> <span data-ar="نشر الآن">Publish now</span>
        </button>
        <input className="input input-sm" type="datetime-local" dir="ltr" value={when} onChange={(e) => setWhen(e.target.value)} style={{ width: 200 }} />
        <button className="btn btn-primary btn-sm" type="button" disabled={busy} onClick={() => go(false)}>
          <i className="ti ti-calendar-plus" /> <span data-ar="جدولة">Schedule</span>
        </button>
      </div>
    </div>
  );
}

export default function PublishingCenter({ accounts, ready, jobs }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const connectedSet = new Set(accounts.filter((a) => a.status === 'connected').map((a) => a.platform));
  const anyConnected = connectedSet.size > 0;

  async function retry(id) {
    try {
      const res = await fetch(`/api/publishing/jobs/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast('أُعيدت المحاولة', 'info');
      router.refresh();
    } catch { toast('تعذّرت إعادة المحاولة', 'error'); }
  }

  async function runQueue() {
    setRunning(true);
    try {
      const res = await fetch('/api/publishing/process', { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      toast(`تمت معالجة ${j.processed ?? 0} مهمة من قائمة النشر`, 'info');
      router.refresh();
    } catch { toast('تعذّر تشغيل القائمة', 'error'); }
    setRunning(false);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="display" data-ar="مركز النشر">Publishing Center</div>
            <div className="muted" data-ar="أرسل المواد المعتمدة إلى المنصات — نشر فوري أو جدولة">Send approved materials to the platforms — publish now or schedule</div>
          </div>
          <Link className="btn btn-sm" href="/connected-accounts"><i className="ti ti-plug" /> <span data-ar="الحسابات المرتبطة">Connected accounts</span></Link>
        </div>
      </div>

      <div className="pipeline">
        {PIPELINE.map((s, i) => (
          <div className="pl-step" key={i}>
            <span className="pl-ic"><i className={'ti ' + s.icon} /></span>
            <span className="pl-t" data-ar={s.ar}>{s.ar}</span>
            {i < PIPELINE.length - 1 && <i className="ti ti-chevron-left pl-arrow" />}
          </div>
        ))}
      </div>

      {!anyConnected && (
        <div className="notice" style={{ background: 'var(--amber-soft)', borderColor: 'var(--amber-soft)' }}>
          <div className="l"><span className="ic" style={{ color: 'var(--amber-ink)' }}><i className="ti ti-plug-x" /></span>
            <span data-ar="لا توجد حسابات مرتبطة بعد — اربط منصة من «الحسابات المرتبطة» ليتم النشر فعلياً.">No connected accounts yet — connect one so publishing actually goes out.</span></div>
          <Link className="btn btn-sm" href="/connected-accounts" data-ar="ربط حساب">Connect</Link>
        </div>
      )}

      <div className="section-label"><i className="ti ti-checks" style={{ color: 'var(--green)' }} /> <span data-ar="مواد معتمدة جاهزة للنشر">Approved &amp; ready</span> <span className="cnt">{ready.length}</span></div>
      {ready.length === 0 ? (
        <div className="empty-state"><i className="ti ti-inbox" /><div data-ar="لا توجد مواد معتمدة بانتظار النشر">No approved materials waiting</div></div>
      ) : (
        <div className="ready-grid">{ready.map((p) => <ReadyItem key={p.id} post={p} connectedSet={connectedSet} />)}</div>
      )}

      <div className="section-label" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i className="ti ti-list-check" style={{ color: 'var(--brand)' }} /> <span data-ar="قائمة مهام النشر">Publishing queue</span> <span className="cnt">{jobs.length}</span></span>
        <button className="btn btn-sm" type="button" disabled={running} onClick={runQueue}><i className={'ti ' + (running ? 'ti-loader-2' : 'ti-refresh')} /> <span data-ar="تشغيل القائمة الآن">Run queue</span></button>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state"><i className="ti ti-list" /><div data-ar="لا توجد مهام نشر بعد">No publishing jobs yet</div></div>
      ) : (
        <div className="jobs-list">
          {jobs.map((j) => {
            const st = JOB_STATUS[j.status] || JOB_STATUS.pending;
            return (
              <div className="job-row" key={j.id}>
                <span className="job-plat" title={PLATFORM_AR[j.platform] || j.platform}><i className={'ti ' + (PLATFORM[j.platform] || 'ti-world')} /></span>
                <span className="job-title" data-ar={j.postTitleAr || undefined}>{j.postTitle}</span>
                <span className={'badge ' + st.cls}><span data-ar={st.ar}>{st.en}</span></span>
                <span className="job-when">{j.scheduledAt ? <span data-ar={`مجدولة: ${j.scheduledAtStr}`}>{`Sched: ${j.scheduledAtStr}`}</span> : j.createdAtStr}</span>
                <span className="job-extra">
                  {j.externalUrl && <a href={j.externalUrl} target="_blank" rel="noreferrer" className="link"><i className="ti ti-external-link" /> <span data-ar="المنشور">View</span></a>}
                  {j.error && <span className="job-err" title={j.error}><i className="ti ti-alert-circle" /> {j.error.slice(0, 60)}</span>}
                </span>
                {(j.status === 'failed' || j.status === 'retry') && (
                  <button className="btn btn-sm" type="button" onClick={() => retry(j.id)}><i className="ti ti-reload" /> <span data-ar="إعادة">Retry</span></button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
