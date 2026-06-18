'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function I18nClient() {
  const pathname = usePathname();

  useEffect(() => {
    let current = 'en';
    try { current = localStorage.getItem('flx-lang') || 'en'; } catch {}
    let observer;

    function apply(lang) {
      current = lang;
      const root = document.documentElement;
      root.lang = lang;
      root.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.body.classList.toggle('lang-ar', lang === 'ar');

      if (observer) observer.disconnect();

      document.querySelectorAll('[data-ar]').forEach((el) => {
        if (el.getAttribute('data-en') === null) el.setAttribute('data-en', el.innerHTML.trim());
        const next = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (next != null && el.innerHTML !== next) el.innerHTML = next;
      });
      document.querySelectorAll('[data-ar-ph]').forEach((el) => {
        if (el.getAttribute('data-en-ph') === null) el.setAttribute('data-en-ph', el.getAttribute('placeholder') || '');
        el.setAttribute('placeholder', lang === 'ar' ? el.getAttribute('data-ar-ph') : el.getAttribute('data-en-ph'));
      });
      document.querySelectorAll('.lang-seg [data-lang]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      });

      try { localStorage.setItem('flx-lang', lang); } catch {}
      if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }

    apply(current);

    // Re-translate content that React renders after navigation / filtering.
    observer = new MutationObserver(() => apply(current));
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (e) => {
      const b = e.target.closest('[data-lang]');
      if (b) { e.preventDefault(); apply(b.getAttribute('data-lang')); }
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  return null;
}
