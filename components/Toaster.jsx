'use client';
import { useEffect, useState } from 'react';

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let id = 0;
    const onToast = (e) => {
      const item = { id: ++id, ...e.detail };
      setItems((list) => [...list, item]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== item.id)), 3200);
    };
    window.addEventListener('flx-toast', onToast);
    return () => window.removeEventListener('flx-toast', onToast);
  }, []);

  if (items.length === 0) return null;

  const color = (t) =>
    t === 'success' ? 'var(--green)' : t === 'error' ? 'var(--red)' : t === 'warn' ? 'var(--amber)' : 'var(--brand)';
  const icon = (t) =>
    t === 'success' ? 'ti-circle-check' : t === 'error' ? 'ti-alert-circle' : t === 'warn' ? 'ti-info-circle' : 'ti-bell';

  return (
    <div style={{ position: 'fixed', insetInlineEnd: 20, bottom: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {items.map((it) => (
        <div key={it.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)',
          border: '1px solid var(--border)', borderInlineStart: `3px solid ${color(it.type)}`,
          borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-lg)', padding: '11px 15px',
          fontSize: 13.5, color: 'var(--ink)', maxWidth: 340, minWidth: 200,
        }}>
          <i className={'ti ' + icon(it.type)} style={{ fontSize: 18, color: color(it.type), flex: 'none' }} />
          <span dir="auto">{it.message}</span>
        </div>
      ))}
    </div>
  );
}
