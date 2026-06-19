import TimelinePage from '@/components/TimelinePage';

export const dynamic = 'force-dynamic';

export default function PublishedPage({ searchParams }) {
  return <TimelinePage mode="published" searchParams={searchParams} />;
}
