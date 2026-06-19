import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAccessibleClients } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';
import { PLATFORM_KEYS } from '@/lib/publishing/platforms';
import PublishingCenter from '@/components/PublishingCenter';

export const dynamic = 'force-dynamic';

const TZ = 'Asia/Hebron';
const fmt = (d) => d ? new Intl.DateTimeFormat('ar-EG', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '';

export default async function PublishingCenterPage() {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) redirect('/');

  const clients = await getAccessibleClients(user);
  const byId = Object.fromEntries(clients.map((c) => [c.id, c]));
  const ids = clients.map((c) => c.id);

  const accountRows = await prisma.socialAccount.findMany({ where: { workspaceId: user.workspaceId } });
  const accounts = PLATFORM_KEYS.map((k) => ({ platform: k, status: accountRows.find((a) => a.platform === k)?.status || 'disconnected' }));

  const readyPosts = ids.length
    ? await prisma.post.findMany({ where: { clientId: { in: ids }, status: 'approved' }, orderBy: { publishAt: 'asc' }, take: 50 })
    : [];
  const ready = readyPosts.map((p) => {
    let platforms = []; try { platforms = p.platforms ? JSON.parse(p.platforms) : []; } catch {}
    const c = byId[p.clientId];
    return { id: p.id, title: p.title, titleAr: p.titleAr, type: p.type, platforms, clientName: c?.name || '', clientNameAr: c?.nameAr || '' };
  });

  const jobRows = await prisma.publishingJob.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: 'desc' }, take: 60,
    include: { post: { select: { title: true, titleAr: true } } },
  });
  const jobs = jobRows.map((j) => ({
    id: j.id, platform: j.platform, status: j.status, error: j.error, externalUrl: j.externalUrl,
    postTitle: j.post?.title || '—', postTitleAr: j.post?.titleAr || null,
    scheduledAt: j.scheduledAt ? j.scheduledAt.toISOString() : null,
    scheduledAtStr: fmt(j.scheduledAt), createdAtStr: fmt(j.createdAt),
  }));

  return <PublishingCenter accounts={accounts} ready={ready} jobs={jobs} />;
}
