import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAccessibleClients } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';
import { PLATFORM, PLATFORM_AR, TYPE } from '@/lib/ui';
import DayFilter from '@/components/DayFilter';

const TZ = 'Asia/Hebron'; // Palestine — keep day grouping stable regardless of server TZ.
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const dayLabelAr = (d) => new Intl.DateTimeFormat('ar-EG', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
const dayLabelEn = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
const timeStr = (d) => new Intl.DateTimeFormat('ar-EG', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);

// mode: 'scheduled' (status approved + publishAt) | 'published' (status published)
export default async function TimelinePage({ mode, searchParams }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) redirect('/');

  const clients = await getAccessibleClients(user);
  const byId = Object.fromEntries(clients.map((c) => [c.id, c]));
  const ids = clients.map((c) => c.id);

  const where = mode === 'published'
    ? { clientId: { in: ids }, status: 'published', publishAt: { not: null } }
    : { clientId: { in: ids }, status: 'approved', publishAt: { not: null } };

  const posts = ids.length
    ? await prisma.post.findMany({ where, orderBy: { publishAt: mode === 'published' ? 'desc' : 'asc' } })
    : [];

  const filterDate = typeof searchParams?.date === 'string' ? searchParams.date : '';

  // Group by local day.
  const groups = [];
  const index = {};
  for (const p of posts) {
    const d = new Date(p.publishAt);
    const key = dayKey(d);
    if (filterDate && key !== filterDate) continue;
    if (index[key] === undefined) { index[key] = groups.length; groups.push({ key, ar: dayLabelAr(d), en: dayLabelEn(d), items: [] }); }
    groups[index[key]].items.push({ p, d });
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const titleAr = mode === 'published' ? 'مواد منشورة' : 'منشورات مجدولة للنشر';
  const titleEn = mode === 'published' ? 'Published' : 'Scheduled to publish';
  const subAr = mode === 'published' ? 'كل ما تم نشره — مرتّب باليوم' : 'كل ما هو مجدول للنشر — مرتّب باليوم';

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="display" data-ar={titleAr}>{titleEn}</div>
            <div className="muted" data-ar={`${subAr} · ${total} مادة`}>{`${total} items`}</div>
          </div>
          <DayFilter value={filterDate} />
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <i className={'ti ' + (mode === 'published' ? 'ti-checkbox' : 'ti-calendar-clock')} />
          <div data-ar={filterDate ? 'لا توجد مواد في هذا اليوم' : (mode === 'published' ? 'لا توجد مواد منشورة بعد' : 'لا توجد منشورات مجدولة بعد')}>
            {filterDate ? 'Nothing on this day' : 'Nothing here yet'}
          </div>
        </div>
      ) : groups.map((g) => (
        <div className="tl-group" key={g.key}>
          <div className="tl-day"><i className="ti ti-calendar" /> <span data-ar={g.ar}>{g.en}</span> <span className="cnt">{g.items.length}</span></div>
          <div className="tl-rows">
            {g.items.map(({ p, d }) => {
              const c = byId[p.clientId];
              const t = TYPE[p.type] || TYPE.copy;
              return (
                <Link href={`/posts/${p.id}`} className="tl-row" key={p.id}>
                  <span className="tl-time">{timeStr(d)}</span>
                  <span className="tl-client">
                    {c?.logoUrl ? <img src={c.logoUrl} alt="" /> : <span className="ph">{c?.initials || 'ن'}</span>}
                    <span className="cn" data-ar={c?.nameAr || undefined}>{c?.name || '—'}</span>
                  </span>
                  <span className="tl-title"><i className={'ti ' + t.icon} /> <span data-ar={p.titleAr || undefined}>{p.title}</span></span>
                  <span className="tl-plat">
                    <i className={'ti ' + (PLATFORM[p.platform] || 'ti-world')} />
                    <span data-ar={PLATFORM_AR[p.platform] || p.platform}>{p.platform}</span>
                  </span>
                  <i className="ti ti-chevron-left tl-go" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
