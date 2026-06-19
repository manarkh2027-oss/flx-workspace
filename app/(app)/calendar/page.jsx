import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';
import { canUpload } from '@/lib/permissions';
import AddMaterial from '@/components/AddMaterial';

export const dynamic = 'force-dynamic';

const STATUS_COLOR = { review: 'amber', revision: 'blue', approved: 'green', published: 'brand', draft: 'amber' };

const MONTHS = [
  { en: 'January', ar: 'يناير' }, { en: 'February', ar: 'فبراير' }, { en: 'March', ar: 'مارس' },
  { en: 'April', ar: 'أبريل' }, { en: 'May', ar: 'مايو' }, { en: 'June', ar: 'يونيو' },
  { en: 'July', ar: 'يوليو' }, { en: 'August', ar: 'أغسطس' }, { en: 'September', ar: 'سبتمبر' },
  { en: 'October', ar: 'أكتوبر' }, { en: 'November', ar: 'نوفمبر' }, { en: 'December', ar: 'ديسمبر' },
];
const DOW = [
  { en: 'Sun', ar: 'الأحد' }, { en: 'Mon', ar: 'الإثنين' }, { en: 'Tue', ar: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء' }, { en: 'Thu', ar: 'الخميس' }, { en: 'Fri', ar: 'الجمعة' }, { en: 'Sat', ar: 'السبت' },
];

export default async function CalendarPage({ searchParams }) {
  const now = new Date();
  const realY = now.getFullYear();
  const realM = now.getMonth();
  const realD = now.getDate();

  // Visible month — from the URL, falling back to today's real month.
  let year = parseInt(searchParams?.y, 10);
  let month = parseInt(searchParams?.m, 10);
  if (!Number.isFinite(year)) year = realY;
  if (!Number.isFinite(month) || month < 0 || month > 11) month = realM;
  const view = searchParams?.view === 'agenda' ? 'agenda' : 'month';

  const user = await getCurrentUser();
  const mayUpload = canUpload(user?.role);
  const clientId = await getActiveClientId(user);
  const posts = clientId
    ? await prisma.post.findMany({ where: { clientId, publishAt: { not: null } }, orderBy: { publishAt: 'asc' } })
    : [];

  // Group this month's posts by day; collect a sorted agenda for the month.
  const byDay = {};
  const agenda = [];
  for (const p of posts) {
    const dt = new Date(p.publishAt);
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      const ev = { en: p.title, ar: p.titleAr, color: STATUS_COLOR[p.status] || 'amber', day: dt.getDate(), id: p.id, dt };
      (byDay[dt.getDate()] ||= []).push(ev);
      agenda.push(ev);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ dim: true, num: prevDays - firstDow + 1 + i });
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push({ num: dd, day: dd });
  let tail = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) cells.push({ dim: true, num: tail++ });

  const isRealMonth = year === realY && month === realM;
  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const mLabel = MONTHS[month];
  const href = (q) => `/calendar?${new URLSearchParams(q).toString()}`;

  return (
    <div className="page">
      <div className="cal-head">
        <div className="cal-nav">
          <Link className="btn btn-icon btn-sm" href={href({ y: prev.y, m: prev.m, view })} aria-label="Previous month"><i className="ti ti-chevron-left" /></Link>
          <span className="mo" data-ar={`${mLabel.ar} ${year}`}>{`${mLabel.en} ${year}`}</span>
          <Link className="btn btn-icon btn-sm" href={href({ y: next.y, m: next.m, view })} aria-label="Next month"><i className="ti ti-chevron-right" /></Link>
          <Link className="btn btn-sm" href={href({ view })} data-ar="اليوم">Today</Link>
        </div>
        <div className="view-seg">
          <Link className={view === 'month' ? 'active' : ''} href={href({ y: year, m: month, view: 'month' })} data-ar="شهر">Month</Link>
          <Link className={view === 'agenda' ? 'active' : ''} href={href({ y: year, m: month, view: 'agenda' })} data-ar="قائمة">Agenda</Link>
        </div>
      </div>

      {view === 'month' ? (
        <div className="cal">
          <div className="dow">{DOW.map((dw) => <div key={dw.en} data-ar={dw.ar}>{dw.en}</div>)}</div>
          <div className="grid">
            {cells.map((c, i) => {
              const dateStr = !c.dim ? `${year}-${String(month + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}` : '';
              return (
                <div className={'cell' + (c.dim ? ' dim' : '') + (!c.dim && isRealMonth && c.day === realD ? ' today' : '')} key={i}>
                  <div className="num">{c.num}</div>
                  {mayUpload && !c.dim && (
                    <AddMaterial defaultDate={dateStr} className="cell-add" label={{ ar: '', en: '' }} />
                  )}
                  {!c.dim && (byDay[c.day] || []).map((ev, j) => (
                    <Link href={`/posts/${ev.id}`} className={'ev ' + ev.color} key={j}>
                      <span className="d" style={{ background: `var(--${ev.color === 'brand' ? 'brand' : ev.color})` }} />
                      <span data-ar={ev.ar || undefined}>{ev.en}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cal-agenda">
          {agenda.length === 0 ? (
            <div className="muted" style={{ padding: '24px 4px' }} data-ar="لا توجد منشورات مجدولة في هذا الشهر">No scheduled posts this month</div>
          ) : agenda.map((ev, i) => (
            <Link href={`/posts/${ev.id}`} className="ag-row" key={i}>
              <div className="ag-date">
                <span className="ag-d">{ev.day}</span>
                <span className="ag-w" data-ar={DOW[ev.dt.getDay()].ar}>{DOW[ev.dt.getDay()].en}</span>
              </div>
              <span className="d" style={{ background: `var(--${ev.color === 'brand' ? 'brand' : ev.color})` }} />
              <span className="ag-title" data-ar={ev.ar || undefined}>{ev.en}</span>
              <i className="ti ti-chevron-left ag-go" />
            </Link>
          ))}
        </div>
      )}

      <div className="legend">
        <span><span className="d" style={{ background: 'var(--amber)' }} /><span data-ar="بانتظار المراجعة">Needs review</span></span>
        <span><span className="d" style={{ background: 'var(--blue)' }} /><span data-ar="قيد التعديل">In revision</span></span>
        <span><span className="d" style={{ background: 'var(--green)' }} /><span data-ar="معتمد · جاهز للنشر">Approved · scheduled</span></span>
        <span><span className="d" style={{ background: 'var(--brand)' }} /><span data-ar="منشور">Published</span></span>
      </div>
    </div>
  );
}
