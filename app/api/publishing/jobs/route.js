import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessClient } from '@/lib/access';
import { canManageClients } from '@/lib/permissions';
import { PLATFORM_KEYS } from '@/lib/publishing/platforms';
import { createJobsForPost, processJobs } from '@/lib/publishing/service';

// List recent publishing jobs for the admin's workspace (with post + client info).
export async function GET(req) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const jobs = await prisma.publishingJob.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: { post: { select: { title: true, titleAr: true } } },
  });
  return NextResponse.json({ jobs });
}

// Send a material to the Publishing Center: create a job per platform and,
// for "publish now", run the real pipeline immediately.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const postId = String(b.postId || '');
  const platforms = Array.isArray(b.platforms) ? b.platforms.filter((p) => PLATFORM_KEYS.includes(p)) : [];
  if (!postId || platforms.length === 0) return NextResponse.json({ error: 'اختر المادة والمنصات' }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId }, include: { client: { select: { workspaceId: true } } } });
  if (!post || !(await canAccessClient(user, post.clientId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const now = !!b.now;
  let scheduledAt = null;
  if (!now) {
    if (!b.scheduledAt) return NextResponse.json({ error: 'حدّد موعد الجدولة' }, { status: 400 });
    const dt = new Date(b.scheduledAt);
    if (Number.isNaN(dt.getTime())) return NextResponse.json({ error: 'تاريخ غير صحيح' }, { status: 400 });
    scheduledAt = dt;
  }

  const jobs = await createJobsForPost({
    post, workspaceId: post.client.workspaceId, platforms, scheduledAt, userId: user.id,
  });

  // Publish now → execute the pipeline at once so the admin sees real results.
  let results = null;
  if (now) results = await processJobs(jobs.map((j) => j.id));

  return NextResponse.json({ ok: true, count: jobs.length, scheduled: !now, results });
}
