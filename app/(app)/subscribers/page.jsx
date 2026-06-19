import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAccessibleClients } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';
import AddSubscriber from '@/components/AddSubscriber';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) redirect('/');

  const clients = await getAccessibleClients(user);
  const ids = clients.map((c) => c.id);
  const posts = ids.length
    ? await prisma.post.findMany({ where: { clientId: { in: ids } }, select: { clientId: true, status: true } })
    : [];

  const stat = {};
  for (const p of posts) {
    const s = (stat[p.clientId] ||= { total: 0, review: 0, approved: 0 });
    s.total++;
    if (p.status === 'review' || p.status === 'revision') s.review++;
    if (p.status === 'approved' || p.status === 'published') s.approved++;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="display" data-ar="الزبائن والمشتركين">Subscribers</div>
            <div className="muted" data-ar="كل العملاء — افتح أي عميل لرفع المواد ومتابعة الاعتماد">All clients — open one to upload materials and track approvals</div>
          </div>
          <AddSubscriber />
        </div>
      </div>

      <div className="subs-grid">
        {clients.map((c) => {
          const s = stat[c.id] || { total: 0, review: 0, approved: 0 };
          return (
            <Link className="sub-card" href={`/subscribers/${c.id}`} key={c.id}>
              <div className="sub-top">
                {c.logoUrl
                  ? <img className="sub-logo" src={c.logoUrl} alt="" />
                  : <span className="sub-logo ph">{c.initials || 'ن'}</span>}
                <div className="sub-meta">
                  <div className="sub-name" data-ar={c.nameAr || undefined}>{c.name}</div>
                  <div className="sub-sub" data-ar={`${s.total} مواد`}>{`${s.total} materials`}</div>
                </div>
                <i className="ti ti-chevron-left sub-go" />
              </div>
              <div className="sub-stats">
                <span className="badge badge--amber"><span className="dot" /> <span data-ar={`${s.review} بانتظار`}>{`${s.review} pending`}</span></span>
                <span className="badge badge--green"><span className="dot" /> <span data-ar={`${s.approved} معتمد`}>{`${s.approved} approved`}</span></span>
              </div>
            </Link>
          );
        })}
        {clients.length === 0 && (
          <div className="empty-state"><i className="ti ti-users" /><div data-ar="لا يوجد عملاء بعد">No clients yet</div></div>
        )}
      </div>
    </div>
  );
}
