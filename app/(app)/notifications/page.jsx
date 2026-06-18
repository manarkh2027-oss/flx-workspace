import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import MarkAllReadButton from '@/components/MarkAllReadButton';

export const dynamic = 'force-dynamic';

const TYPEMAP = {
  approval: { bg: 'var(--amber-soft)', color: 'var(--amber)', icon: 'ti-clock-pause' },
  comment: { bg: 'var(--blue-soft)', color: 'var(--blue-ink)', icon: 'ti-message-2' },
  mention: { bg: 'var(--brand-soft)', color: 'var(--brand-700)', icon: 'ti-at' },
  publish: { bg: 'var(--brand-soft)', color: 'var(--brand-700)', icon: 'ti-send' },
  revision: { bg: 'var(--surface-2)', color: 'var(--ink-2)', icon: 'ti-rotate' },
  system: { bg: 'var(--surface-2)', color: 'var(--ink-2)', icon: 'ti-folder-plus' },
};

const BUCKETS = [
  { key: 'today', en: 'Today', ar: 'اليوم' },
  { key: 'yesterday', en: 'Yesterday', ar: 'أمس' },
  { key: 'earlier', en: 'Earlier', ar: 'الأسبوع الماضي' },
];

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="n-head">
        <div>
          <div className="display" data-ar="الإشعارات">Notifications</div>
          <div className="muted" data-ar={`${unread} إشعارات غير مقروءة`}>{`${unread} unread notifications`}</div>
        </div>
        <MarkAllReadButton />
      </div>

      {notes.length === 0 && <p className="hint" data-ar="لا توجد إشعارات بعد.">No notifications yet.</p>}

      {BUCKETS.map((b) => {
        const rows = notes.filter((n) => n.bucket === b.key);
        if (rows.length === 0) return null;
        return (
          <div key={b.key}>
            <div className="day-label" data-ar={b.ar}>{b.en}</div>
            <div className="nlist">
              {rows.map((n) => {
                const m = TYPEMAP[n.type] || TYPEMAP.system;
                return (
                  <div className={'n-row' + (n.read ? '' : ' unread')} key={n.id}>
                    <span className="ic" style={{ background: m.bg, color: m.color }}><i className={'ti ' + m.icon} /></span>
                    <div className="body">
                      <div className="tx" data-ar={n.titleAr} dangerouslySetInnerHTML={{ __html: n.titleEn }} />
                    </div>
                    {!n.read && <span className="udot" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
