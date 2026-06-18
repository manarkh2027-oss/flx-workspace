'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TopSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function go(e) {
    e.preventDefault();
    const term = q.trim();
    router.push('/archive' + (term ? '?q=' + encodeURIComponent(term) : ''));
  }

  return (
    <form className="search-bar" onSubmit={go} role="search">
      <i className="ti ti-search" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search your posts…"
        data-ar-ph="ابحث في منشوراتك…"
      />
      <button type="submit" className="search-go" aria-label="Search"><i className="ti ti-arrow-right" /></button>
    </form>
  );
}
