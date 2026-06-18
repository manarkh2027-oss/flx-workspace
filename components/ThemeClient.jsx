'use client';
import { useEffect } from 'react';

export default function ThemeClient() {
  useEffect(() => {
    function apply(pref) {
      const resolved =
        pref === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : pref;
      document.documentElement.setAttribute('data-theme', resolved);
      document.querySelectorAll('[data-theme-set]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-theme-set') === pref);
      });
      try { localStorage.setItem('flx-theme', pref); } catch {}
    }

    let saved = 'light';
    try { saved = localStorage.getItem('flx-theme') || 'light'; } catch {}
    apply(saved);

    const onClick = (e) => {
      const b = e.target.closest('[data-theme-set]');
      if (b) { e.preventDefault(); apply(b.getAttribute('data-theme-set')); }
    };
    document.addEventListener('click', onClick);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMq = () => {
      let s = 'light';
      try { s = localStorage.getItem('flx-theme') || 'light'; } catch {}
      if (s === 'system') apply('system');
    };
    mq.addEventListener('change', onMq);

    return () => {
      document.removeEventListener('click', onClick);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  return null;
}
