import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessClient } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';
import { STATUS, TYPE, PLATFORM } from '@/lib/ui';
import AddMaterial from '@/components/AddMaterial';
import DeleteClient from '@/components/DeleteClient';

export const dynamic = 'force-dynamic';

export default async function SubscriberDetail({ params }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) redirect('/');
  if (!(await canAccessClient(user, params.id))) notFound();

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  const posts = await prisma.post.findMany({
    where: { clientId: client.id },
    include: { comments: { orderBy: { createdAt: 'desc' }, take: 5, include: { author: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const pending = posts.filter((p) => p.status !== 'approved' && p.status !== 'published');
  const approved = posts.filter((p) => p.status === 'approved' || p.status === 'published');

  function Card({ p }) {
    const t = TYPE[p.type] || TYPE.copy;
    const s = STATUS[p.status] || STATUS.review;
    const isVideo = p.type === 'video' && p.mediaUrl;
    const isImg = (p.type === 'image' || p.type === 'design') && p.mediaUrl;
    const revisionNote = p.status === 'revision'
      ? p.comments.find((c) => c.author.role === 'client' || c.body.startsWith('🔄'))
      : null;
    return (
      <div className="pcard">
        <Link href={`/posts/${p.id}`} className="pcard-main">
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
            {revisionNote && (
              <div className="rev-note"><i className="ti ti-message-2-exclamation" /> <span dir="auto">{revisionNote.body.replace(/^🔄\s*/, '')}</span></div>
            )}
          </div>
        </Link>
        <div className="card-acts">
          <Link className="btn btn-sm" href={`/posts/${p.id}`} style={{ flex: 1, justifyContent: 'center' }}>
            <i className="ti ti-message-circle" /> <span data-ar={p.status === 'revision' ? 'الرد على الزبون' : 'فتح ومتابعة'}>{p.status === 'revision' ? 'Reply' : 'Open'}</span>
          </Link>
          <AddMaterial className="btn btn-sm" post={{ id: p.id, type: p.type, title: p.title, body: p.body || '', platform: p.platform, publishAt: p.publishAt, mediaUrl: p.mediaUrl }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div className="row" style={{ gap: 14 }}>
            <Link href="/subscribers" className="icon-btn" aria-label="Back"><i className="ti ti-arrow-right" /></Link>
            {client.logoUrl
              ? <img className="sub-logo" src={client.logoUrl} alt="" />
              : <span className="sub-logo ph">{client.initials || 'ن'}</span>}
            <div>
              <div className="display" data-ar={client.nameAr || undefined}>{client.name}</div>
              <div className="muted" data-ar={`${posts.length} مواد · ${pending.length} بانتظار الاعتماد`}>{`${posts.length} materials · ${pending.length} pending`}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <DeleteClient clientId={client.id} clientName={client.name} clientNameAr={client.nameAr} />
            <AddMaterial clientId={client.id} />
          </div>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-inbox" />
          <div data-ar="لا توجد مواد لهذا العميل بعد">No materials for this client yet</div>
          <div style={{ marginTop: 12 }}><AddMaterial clientId={client.id} /></div>
        </div>
      )}

      {pending.length > 0 && <div className="posts">{pending.map((p) => <Card key={p.id} p={p} />)}</div>}

      {approved.length > 0 && (
        <>
          <div className="section-label">
            <i className="ti ti-rosette-discount-check" style={{ color: 'var(--green)' }} />
            <span data-ar="منشورات معتمدة للنشر">Approved for publishing</span>
            <span className="cnt">{approved.length}</span>
          </div>
          <div className="posts">{approved.map((p) => <Card key={p.id} p={p} />)}</div>
        </>
      )}
    </div>
  );
}
