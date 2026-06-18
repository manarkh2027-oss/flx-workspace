'use client';
import { useState } from 'react';
import Link from 'next/link';
import { STATUS, TYPE, PLATFORM } from '@/lib/ui';

const FILTERS = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'video', en: 'Video', ar: 'فيديو' },
  { key: 'image', en: 'Image', ar: 'صور' },
  { key: 'design', en: 'Design', ar: 'تصاميم' },
  { key: 'copy', en: 'Copy', ar: 'نصوص' },
];

export default function ArchiveClient({ items }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const shown = items.filter((it) => {
    if (filter !== 'all' && it.type !== filter) return false;
    if (!q.trim()) return true;
    const hay = (it.title + ' ' + (it.titleAr || '') + ' ' + (it.campaign || '')).toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="page">
      <div className="page-head">
        <div className="display" data-ar="الأرشيف">Archive</div>
        <div className="muted" data-ar="ابحث في كل أعمالك السابقة واسترجعها في ثوانٍ">Search and retrieve all your past work in seconds</div>
      </div>

      <div className="big-search">
        <i className="ti ti-search" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, designs, copy…"
          data-ar-ph="ابحث في الفيديوهات والتصاميم والنصوص…"
        />
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={'chip' + (filter === f.key ? ' active' : '')} onClick={() => setFilter(f.key)}>
            <span data-ar={f.ar}>{f.en}</span>
          </button>
        ))}
      </div>

      <div className="res-head">
        <div className="c" data-ar={`${shown.length} عنصراً`}>{`${shown.length} items`}</div>
      </div>

      <div className="res">
        {shown.length === 0 && <div className="res-empty" data-ar="لا توجد نتائج مطابقة">No matching results</div>}
        {shown.map((it) => {
          const t = TYPE[it.type] || TYPE.copy;
          const s = STATUS[it.status] || STATUS.review;
          return (
            <Link className="res-row" href={`/posts/${it.id}`} key={it.id}>
              <div className={'thumb ' + t.grad}>
                <i className={'ti ' + (it.type === 'video' ? 'ti-player-play' : it.type === 'copy' ? 'ti-quote' : 'ti-photo')} />
              </div>
              <div className="info">
                <div className="n" data-ar={it.titleAr || undefined}>{it.title}</div>
                <div className="m">
                  <span data-ar={t.ar}>{t.en}</span>
                  {it.campaign && (<><span className="sep" /><span data-ar={it.campaignAr || undefined}>{it.campaign}</span></>)}
                  <span className="sep" />
                  <span className={'badge ' + s.badge} style={{ height: 19, fontSize: 11 }}><span className="dot" /><span data-ar={s.ar}>{s.en}</span></span>
                </div>
              </div>
              <div className="date">{it.date}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
