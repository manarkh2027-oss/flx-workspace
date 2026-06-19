'use client';
import { useRouter, usePathname } from 'next/navigation';

// A date picker that filters a timeline page to a single day via ?date=YYYY-MM-DD.
export default function DayFilter({ value }) {
  const router = useRouter();
  const pathname = usePathname();

  function set(date) {
    router.push(date ? `${pathname}?date=${date}` : pathname);
  }

  return (
    <div className="day-filter">
      <i className="ti ti-calendar-search" />
      <input type="date" dir="ltr" value={value || ''} onChange={(e) => set(e.target.value)} />
      {value && (
        <button type="button" className="df-clear" onClick={() => set('')} title="عرض كل الأيام">
          <i className="ti ti-x" /> <span data-ar="كل الأيام">All days</span>
        </button>
      )}
    </div>
  );
}
