import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';
import { canUpload, canApprove } from '@/lib/permissions';
import PostsBoard from '@/components/PostsBoard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const clientId = await getActiveClientId(user);
  const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;

  const posts = clientId
    ? await prisma.post.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } })
    : [];

  const data = posts.map((p) => ({
    id: p.id,
    title: p.title,
    titleAr: p.titleAr,
    type: p.type,
    platform: p.platform,
    status: p.status,
    dayEn: p.dayEn,
    dayAr: p.dayAr,
    mediaUrl: p.mediaUrl,
  }));

  return (
    <PostsBoard
      posts={data}
      banner={client?.bannerUrl || null}
      clientName={client?.name || ''}
      clientNameAr={client?.nameAr || ''}
      canUpload={canUpload(user?.role)}
      canApprove={canApprove(user?.role)}
    />
  );
}
