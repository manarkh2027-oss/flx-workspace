import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';

export const dynamic = 'force-dynamic';

const STATUS_COLOR = { review: 'amber', revision: 'blue', approved: 'green', published: 'brand', draft: 'amber' };
const YEAR = 2026;
const MONTH = 5; // June (0-indexed)
const TODAY = 17;

export default async function CalendarPage() {
  const user = await getCurrentUser();
  const clientId = await getActiveClientId(user);
  const posts = clientId
    ? await prisma.post.findMany({ where: { clientId, publishAt: { not: null } } })
    : [];

  const byDay = {};
  for (const p of posts) {
    const d = new Date(p.publishAt);
    if (d.getFullYear() === YEAR && d.getMonth() === MONTH) {
      (byDay[d.getDate()] ||= []).push({ en: p.title, ar: p.titleAr, color: STATUS_COLOR[p.status] || 'amber' });
    }
  }

  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const firstDow = new Date(YEAR, MONTH, 1).getDay();
  const prevDays = new Date(YEAR, MONTH, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ dim: true, num: prevDays - firstDow + 1 + i });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ num: d, day: d });
  let tail = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) cells.push({ dim: true, num: tail++ });

  const DOW = [
    { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الإثنين' }, { en: 'Tue', ar: 'الثلاثاء' },
    { en: 'Wed', ar: 'الأربعاء' }, { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
  ];

  return (
    <div className="page">
      <div className="cal-head">
        <div className="cal-nav">
          <button className="btn btn-icon btn-sm" type="button" data-soon="العرض التجريبي يعرض شهر يونيو 2026"><i className="ti ti-chevron-left" /></button>
          <span className="mo" data-ar="يونيو 2026">June 2026</span>
          <button className="btn btn-icon btn-sm" type="button" data-soon="العرض التجريبي يعرض شهر يونيو 2026"><i className="ti ti-chevron-right" /></button>
          <button className="btn btn-sm" type="button" data-soon="العرض التجريبي يعرض شهر يونيو 2026" data-ar="اليوم">Today</button>
        </div>
        <div className="view-seg">
          <button className="active" type="button" data-ar="شهر">Month</button>
          <button type="button" data-soon="العرض الأسبوعي قادم قريباً" data-ar="أسبوع">Week</button>
        </div>
      </div>

      <div className="cal">
        <div className="dow">{DOW.map((d) => <div key={d.en} data-ar={d.ar}>{d.en}</div>)}</div>
        <div className="grid">
          {cells.map((c, i) => (
            <div className={'cell' + (c.dim ? ' dim' : '') + (c.day === TODAY ? ' today' : '')} key={i}>
              <div className="num">{c.num}</div>
              {!c.dim && (byDay[c.day] || []).map((ev, j) => (
                <div className={'ev ' + ev.color} key={j}>
                  <span className="d" style={{ background: `var(--${ev.color === 'brand' ? 'brand' : ev.color})` }} />
                  <span data-ar={ev.ar || undefined}>{ev.en}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="legend">
        <span><span className="d" style={{ background: 'var(--amber)' }} /><span data-ar="بانتظار المراجعة">Needs review</span></span>
        <span><span className="d" style={{ background: 'var(--blue)' }} /><span data-ar="قيد التعديل">In revision</span></span>
        <span><span className="d" style={{ background: 'var(--green)' }} /><span data-ar="معتمد · جاهز للنشر">Approved · scheduled</span></span>
        <span><span className="d" style={{ background: 'var(--brand)' }} /><span data-ar="منشور">Published</span></span>
      </div>
    </div>
  );
}
