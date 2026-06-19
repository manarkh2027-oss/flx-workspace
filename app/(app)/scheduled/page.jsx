import TimelinePage from '@/components/TimelinePage';

export const dynamic = 'force-dynamic';

export default function ScheduledPage({ searchParams }) {
  return <TimelinePage mode="scheduled" searchParams={searchParams} />;
}
