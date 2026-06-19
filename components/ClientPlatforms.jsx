'use client';
import { useState } from 'react';
import { PLATFORM_LIST, PLATFORM_AR } from '@/lib/ui';
import { toast } from '@/lib/toast';

// CLIENT view, under a material: the client only PICKS which platforms they
// want it published on (a request). No publish / schedule / delete here.
// They also see (read-only) when it was scheduled and on which platform.
export default function ClientPlatforms({ postId, initial = [], platform, publishAt, status }) {
  const [selected, setSelected] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(key) {
    if (busy) return;
    const next = selected.includes(key) ? selected.filter((p) => p !== key) : [...selected, key];
    setSelected(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/platforms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSelected(selected); // revert
      toast('تعذّر حفظ اختيار المنصات', 'error');
    }
    setBusy(false);
  }

  const scheduled = publishAt && (status === 'approved' || status === 'published');
  const dateStr = publishAt ? new Date(publishAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }) : '';

  return (
    <div className="plat-client">
      <div className="pc-label" data-ar="منصات النشر التي تريدها">Platforms you want</div>
      <div className="plat-row">
        {PLATFORM_LIST.map((p) => (
          <button key={p.key} type="button" title={p.ar}
            className={'plat-ic' + (selected.includes(p.key) ? ' on' : '')}
            onClick={() => toggle(p.key)}>
            <i className={'ti ' + p.icon} />
          </button>
        ))}
      </div>
      {scheduled && (
        <div className="pc-sched">
          <i className={'ti ' + (status === 'published' ? 'ti-circle-check' : 'ti-calendar-clock')} />
          <span data-ar={status === 'published' ? `نُشرت${platform ? ' على ' + (PLATFORM_AR[platform] || platform) : ''}` : `مجدولة ${dateStr}${platform ? ' · ' + (PLATFORM_AR[platform] || platform) : ''}`}>
            {status === 'published' ? `Published${platform ? ' · ' + platform : ''}` : `Scheduled ${dateStr}${platform ? ' · ' + platform : ''}`}
          </span>
        </div>
      )}
    </div>
  );
}
