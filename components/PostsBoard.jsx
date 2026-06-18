'use client';
import { useState } from 'react';
import Link from 'next/link';
import { STATUS, TYPE, PLATFORM } from '@/lib/ui';

const FILTERS = [
  { key: 'all', icon: 'ti-layout-grid', en: 'All', ar: 'الكل' },
  { key: 'video', icon: 'ti-video', en: 'Video', ar: 'فيديو' },
  { key: 'image', icon: 'ti-photo', en: 'Image', ar: 'صور' },
  { key: 'design', icon: 'ti-vector', en: 'Design', ar: 'تصاميم' },
  { key: 'copy', icon: 'ti-typography', en: 'Copy', ar: 'نصوص' },
];

export default function PostsBoard({ posts, banner, clientName, clientNameAr }) {
  const [filter, setFilter] = useState('all');
  const reviewCount = posts.filter((p) => p.status === 'review').length;
  const shown = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

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
          <div className="muted" data-ar={`١٤ – ٢٠ يونيو · ${posts.length} منشورات`}>{`14 – 20 June · ${posts.length} posts`}</div>
        </div>
        <div className="week-nav">
          <Link className="btn btn-ghost btn-sm" href="/campaigns" data-ar="عرض الحملات">View campaigns</Link>
          <button className="btn btn-icon btn-sm" type="button"><i className="ti ti-chevron-left" /></button>
          <span className="pill"><i className="ti ti-calendar" style={{ fontSize: 16, color: 'var(--ink-3)' }} /> <span data-ar="هذا الأسبوع">This week</span></span>
          <button className="btn btn-icon btn-sm" type="button"><i className="ti ti-chevron-right" /></button>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="notice">
          <div className="l">
            <span className="ic"><i className="ti ti-clock-pause" /></span>
            <span data-ar={`<b>${reviewCount} منشورات</b> بانتظار موافقتك هذا الأسبوع.`}>
              <b>{reviewCount} posts</b> are waiting for your approval this week.
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

      <div className="posts">
        {shown.map((p) => {
          const t = TYPE[p.type] || TYPE.copy;
          const s = STATUS[p.status] || STATUS.review;
          const isVideo = p.type === 'video' && p.mediaUrl;
          return (
            <Link key={p.id} href={`/posts/${p.id}`} className="pcard">
              <div className={'thumb ' + (isVideo ? 'media' : t.grad)}>
                {isVideo ? (
                  <>
                    <video src={p.mediaUrl + '#t=0.1'} muted preload="metadata" playsInline />
                    <span className="play-badge"><i className="ti ti-player-play" /></span>
                  </>
                ) : (
                  <i className={'ti ' + (p.type === 'copy' ? 'ti-quote' : 'ti-photo') + ' bigic'} />
                )}
                <span className="day" data-ar={p.dayAr}>{p.dayEn}</span>
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
          );
        })}
      </div>
    </div>
  );
}
