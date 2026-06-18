import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';
import ArchiveClient from '@/components/ArchiveClient';

export const dynamic = 'force-dynamic';

export default async function ArchivePage({ searchParams }) {
  const user = await getCurrentUser();
  const initialQuery = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const clientId = await getActiveClientId(user);
  const posts = clientId
    ? await prisma.post.findMany({ where: { clientId }, include: { campaign: true }, orderBy: { publishAt: 'desc' } })
    : [];

  const items = posts.map((p) => ({
    id: p.id,
    title: p.title,
    titleAr: p.titleAr,
    type: p.type,
    platform: p.platform,
    status: p.status,
    campaign: p.campaign?.name || null,
    campaignAr: p.campaign?.nameAr || null,
    date: p.publishAt ? new Date(p.publishAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
  }));

  return <ArchiveClient items={items} initialQuery={initialQuery} />;
}
