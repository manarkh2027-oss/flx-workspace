import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';
import { processJob, logJob } from '@/lib/publishing/service';

// Job detail + its logs.
export async function GET(req, { params }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const job = await prisma.publishingJob.findUnique({
    where: { id: params.id },
    include: { logs: { orderBy: { createdAt: 'asc' } }, post: { select: { title: true } } },
  });
  if (!job || job.workspaceId !== user.workspaceId) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ job });
}

// Retry a failed job: reset to pending and run it again.
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const job = await prisma.publishingJob.findUnique({ where: { id: params.id } });
  if (!job || job.workspaceId !== user.workspaceId) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (job.status === 'published') return NextResponse.json({ error: 'already published' }, { status: 400 });

  await prisma.publishingJob.update({ where: { id: job.id }, data: { status: 'pending', error: null } });
  await logJob(job.id, 'info', 'Manual retry requested');
  const r = await processJob(job.id);
  return NextResponse.json({ ok: true, result: r });
}
