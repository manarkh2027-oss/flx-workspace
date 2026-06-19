import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const clientId = await getActiveClientId(user);
  const campaigns = clientId
    ? await prisma.campaign.findMany({ where: { clientId }, include: { posts: true }, orderBy: { createdAt: 'asc' } })
    : [];

  return (
    <div className="page">
      <div className="page-head">
        <div className="display" data-ar="الحملات">Campaigns</div>
        <div className="muted" data-ar="كل محتوى الحملة في مكان واحد">All your campaign content in one place</div>
      </div>

      <div className="camp-grid">
        {campaigns.map((c) => {
          const total = c.posts.length;
          const approved = c.posts.filter((p) => p.status === 'approved' || p.status === 'published').length;
          const pct = total ? Math.round((approved / total) * 100) : 0;
          return (
            <Link className="camp-card" href={`/campaigns/${c.id}`} key={c.id}>
              <span className="cov"><i className="ti ti-folder" /></span>
              <div className="nm" data-ar={c.nameAr || undefined}>{c.name}</div>
              <div className="ct" data-ar={`${total} عناصر · ${approved} معتمد`}>{`${total} items · ${approved} approved`}</div>
              <div className="bar"><i style={{ width: pct + '%' }} /></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
