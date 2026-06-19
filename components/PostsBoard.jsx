'use client';
import { useState } from 'react';
import Link from 'next/link';
import { STATUS, TYPE, PLATFORM } from '@/lib/ui';
import AddMaterial from '@/components/AddMaterial';
import CardActions from '@/components/CardActions';
import ClientPlatforms from '@/components/ClientPlatforms';
import PublishBar from '@/components/PublishBar';

const FILTERS = [
  { key: 'all', icon: 'ti-layout-grid', en: 'All', ar: 'الكل' },
  { key: 'video', icon: 'ti-video', en: 'Video', ar: 'فيديو' },
  { key: 'image', icon: 'ti-photo', en: 'Image', ar: 'صور' },
  { key: 'design', icon: 'ti-vector', en: 'Design', ar: 'تصاميم' },
  { key: 'copy', icon: 'ti-typography', en: 'Copy', ar: 'نصوص' },
];

function Card({ p, canApprove, canUpload }) {
  const t = TYPE[p.type] || TYPE.copy;
  const s = STATUS[p.status] || STATUS.review;
  const isVideo = p.type === 'video' && p.mediaUrl;
  const isImg = (p.type === 'image' || p.type === 'design') && p.mediaUrl;
  return (
    <div className="pcard">
      <Link href={`/posts/${p.id}`} className="pcard-main">
        <div className={'thumb ' + (isVideo || isImg ? 'media' : t.grad)}>
          {isVideo ? (
            <>
              <video src={p.mediaUrl + '#t=0.1'} muted preload="metadata" playsInline />
              <span className="play-badge"><i className="ti ti-player-play" /></span>
            </>
          ) : isImg ? (
            <img src={p.mediaUrl} alt="" />
          ) : (
            <i className={'ti ' + (p.type === 'copy' ? 'ti-quote' : 'ti-photo') + ' bigic'} />
          )}
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
      </Link>
      {canUpload ? (
        <PublishBar postId={p.id} requested={p.platforms || []} platform={p.platform} publishAt={p.publishAt} status={p.status} />
      ) : canApprove ? (
        <>
          <CardActions postId={p.id} status={p.status} />
          <ClientPlatforms postId={p.id} initial={p.platforms || []} platform={p.platform} publishAt={p.publishAt} status={p.status} />
        </>
      ) : null}
    </div>
  );
}

export default function PostsBoard({ posts, banner, clientName, clientNameAr, canUpload, canApprove }) {
  const [filter, setFilter] = useState('all');
  const reviewCount = posts.filter((p) => p.status === 'review' || p.status === 'revision').length;
  const shown = filter === 'all' ? posts : posts.filter((p) => p.type === filter);
  const pending = shown.filter((p) => p.status === 'review' || p.status === 'revision' || p.status === 'draft');
  const approved = shown.filter((p) => p.status === 'approved' || p.status === 'published');

  return (
    <div className="page">
      {banner && (
        <div className="client-hero">
          <div className="ch-text">
            <div className="ch-kicker" data-ar="مساحة العميل">Client workspace</div>
            <div className="ch-name" data-ar={clientNameAr || undefined}>{clientName}</div>
          </div>
          <img src={banner} alt="" />
        </div>
      )}

      <div className="week-head">
        <div>
          <div className="display" data-ar="منشورات هذا الأسبوع">This week&#39;s posts</div>
          <div className="muted" data-ar={`${posts.length} منشورات`}>{`${posts.length} posts`}</div>
        </div>
        <div className="week-nav">
          {canUpload && <AddMaterial />}
          <Link className="btn btn-ghost btn-sm" href="/campaigns" data-ar="عرض الحملات">View campaigns</Link>
        </div>
      </div>

      {canApprove && reviewCount > 0 && (
        <div className="notice">
          <div className="l">
            <span className="ic"><i className="ti ti-clock-pause" /></span>
            <span data-ar={`<b>${reviewCount} منشورات</b> بانتظار موافقتك.`}>
              <b>{reviewCount} posts</b> are waiting for your approval.
            </span>
          </div>
        </div>
      )}

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={'chip' + (filter === f.key ? ' active' : '')} onClick={() => setFilter(f.key)}>
            <i className={'ti ' + f.icon} /> <span data-ar={f.ar}>{f.en}</span>
          </button>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-inbox" />
          <div data-ar="لا توجد مواد بعد">No materials yet</div>
          {canUpload && <div style={{ marginTop: 12 }}><AddMaterial /></div>}
        </div>
      )}

      {pending.length > 0 && (
        <div className="posts">
          {pending.map((p) => <Card key={p.id} p={p} canApprove={canApprove} canUpload={canUpload} />)}
        </div>
      )}

      {approved.length > 0 && (
        <>
          <div className="section-label">
            <i className="ti ti-rosette-discount-check" style={{ color: 'var(--green)' }} />
            <span data-ar="منشورات معتمدة للنشر">Approved for publishing</span>
            <span className="cnt">{approved.length}</span>
          </div>
          <div className="posts">
            {approved.map((p) => <Card key={p.id} p={p} canApprove={canApprove} canUpload={canUpload} />)}
          </div>
        </>
      )}
    </div>
  );
}
