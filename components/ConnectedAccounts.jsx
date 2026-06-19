'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

const ERRORS = {
  not_configured: 'هذه المنصة تحتاج بيانات تطبيق المطوّر (Client ID/Secret) في متغيّرات البيئة أولاً.',
  denied: 'تم إلغاء ربط الحساب.',
  bad_state: 'انتهت صلاحية جلسة الربط، حاول مجدداً.',
  no_code: 'لم يصل رمز التفويض من المنصة.',
  token_exchange: 'فشل تبادل رمز التفويض — تحقّق من بيانات التطبيق.',
  exception: 'حدث خطأ غير متوقع أثناء الربط.',
  unknown: 'منصة غير معروفة.',
};

export default function ConnectedAccounts({ accounts, banner }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');

  async function disconnect(platform) {
    setBusy(platform);
    try {
      const res = await fetch(`/api/publishing/accounts/${platform}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('تم فصل الحساب ✓', 'success');
      router.refresh();
    } catch { toast('تعذّر فصل الحساب', 'error'); }
    setBusy('');
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="display" data-ar="الحسابات المرتبطة">Connected accounts</div>
        <div className="muted" data-ar="اربط حسابات التواصل الرسمية لتفعيل النشر التلقائي من مركز النشر">Connect official social accounts to enable publishing from the Publishing Center</div>
      </div>

      {banner?.connected && (
        <div className="notice" style={{ background: 'var(--green-soft)', borderColor: 'var(--green-soft)' }}>
          <div className="l"><span className="ic" style={{ color: 'var(--green-ink)' }}><i className="ti ti-circle-check" /></span>
            <span data-ar={`تم ربط ${banner.connected} بنجاح ✓`}>{`Connected ${banner.connected} ✓`}</span></div>
        </div>
      )}
      {banner?.error && (
        <div className="notice" style={{ background: 'var(--amber-soft)', borderColor: 'var(--amber-soft)' }}>
          <div className="l"><span className="ic" style={{ color: 'var(--amber-ink)' }}><i className="ti ti-alert-triangle" /></span>
            <span>{ERRORS[banner.error] || 'تعذّر الربط.'}</span></div>
        </div>
      )}

      <div className="acct-grid">
        {accounts.map((a) => {
          const connected = a.status === 'connected';
          return (
            <div className="acct-card" key={a.platform}>
              <div className="acct-top">
                <span className="acct-ic" style={{ color: a.color }}><i className={'ti ' + a.icon} /></span>
                <div className="acct-meta">
                  <div className="acct-name">{a.en} <span className="acct-ar" data-ar={a.ar}>{a.ar}</span></div>
                  <div className={'acct-status ' + (connected ? 'on' : a.configured ? 'off' : 'na')}>
                    {connected ? <span data-ar="مرتبط">Connected</span>
                      : a.configured ? <span data-ar="غير مرتبط">Not connected</span>
                      : <span data-ar="يحتاج إعداد بيانات التطبيق">Needs app credentials</span>}
                  </div>
                </div>
              </div>

              {connected ? (
                <button className="btn btn-sm" type="button" disabled={busy === a.platform} onClick={() => disconnect(a.platform)} style={{ color: 'var(--red-ink)' }}>
                  <i className="ti ti-plug-connected-x" /> <span data-ar="فصل">Disconnect</span>
                </button>
              ) : a.configured ? (
                <a className="btn btn-primary btn-sm" href={`/api/publishing/oauth/${a.platform}/start`}>
                  <i className="ti ti-plug" /> <span data-ar="ربط الحساب">Connect</span>
                </a>
              ) : (
                <a className="btn btn-sm" href={a.docs} target="_blank" rel="noreferrer">
                  <i className="ti ti-external-link" /> <span data-ar="دليل الإعداد">Setup guide</span>
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="card card-pad" style={{ marginTop: 22 }}>
        <div className="h3" style={{ marginBottom: 8 }} data-ar="ملاحظة للمطوّر">For your developer</div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }} data-ar="لتفعيل النشر الفعلي: سجّل تطبيق مطوّر لكل منصة، ثم أضف Client ID/Secret في متغيّرات البيئة (انظر أسماءها في lib/publishing/platforms.js)، وأضف مفتاح التشفير PUBLISHING_ENC_KEY. الكود يستخدم الـAPIs الرسمية فقط، ومواضع الإكمال موسومة بـ TODO(engineer).">
          To enable real publishing: register a developer app per platform, set each Client ID/Secret env var (names are in lib/publishing/platforms.js), and set PUBLISHING_ENC_KEY. The code uses official APIs only; remaining steps are marked TODO(engineer).
        </div>
      </div>
    </div>
  );
}
