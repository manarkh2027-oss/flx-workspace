import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessClient } from '@/lib/access';
import { STATUS, TYPE, PLATFORM } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function CampaignDetail({ params }) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { posts: { orderBy: { createdAt: 'asc' } }, client: true },
  });
  if (!campaign || !(await canAccessClient(user, campaign.clientId))) notFound();

  const total = campaign.posts.length;
  const approved = campaign.posts.filter((p) => p.status === 'approved' || p.status === 'published').length;
  const pct = total ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <Link href="/campaigns" className="icon-btn" aria-label="Back"><i className="ti ti-arrow-right" /></Link>
          <div>
            <div className="display" data-ar={campaign.nameAr || undefined}>{campaign.name}</div>
            <div className="muted" data-ar={`${total} عناصر · ${approved} معتمد · ${pct}%`}>{`${total} items · ${approved} approved · ${pct}%`}</div>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state"><i className="ti ti-folder-open" /><div data-ar="لا توجد مواد في هذه الحملة بعد">No materials in this campaign yet</div></div>
      ) : (
        <div className="posts">
          {campaign.posts.map((p) => {
            const t = TYPE[p.type] || TYPE.copy;
            const s = STATUS[p.status] || STATUS.review;
            const isVideo = p.type === 'video' && p.mediaUrl;
            const isImg = (p.type === 'image' || p.type === 'design') && p.mediaUrl;
            return (
              <Link key={p.id} href={`/posts/${p.id}`} className="pcard">
                <div className="pcard-main">
                  <div className={'thumb ' + (isVideo || isImg ? 'media' : t.grad)}>
                    {isVideo ? <><video src={p.mediaUrl + '#t=0.1'} muted preload="metadata" playsInline /><span className="play-badge"><i className="ti ti-player-play" /></span></>
                      : isImg ? <img src={p.mediaUrl} alt="" />
                      : <i className={'ti ' + (p.type === 'copy' ? 'ti-quote' : 'ti-photo') + ' bigic'} />}
                    {p.dayEn && <span className="day" data-ar={p.dayAr}>{p.dayEn}</span>}
                    <span className="plat"><i className={'ti ' + (PLATFORM[p.platform] || 'ti-world')} /></span>
                  </div>
                  <div className="body">
                    <div className="nm" data-ar={p.titleAr || undefined}>{p.title}</div>
                    <div className="row2">
                      <span className="type"><i className={'ti ' + t.icon} style={{ fontSize: 14 }} /> <span data-ar={t.ar}>{t.en}</span></span>
                      <span className={'badge ' + s.badge}><span className="dot" /><span data-ar={s.ar}>{s.en}</span></span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
