import { prisma } from '@/lib/db';
import { getPublisher, PublishError } from './publishers';
import { decryptSecret } from './crypto';

// Append a line to a job's audit log (never throws into the caller).
export async function logJob(jobId, level, message, data) {
  try {
    await prisma.publishingLog.create({
      data: { jobId, level, message: String(message).slice(0, 1000), data: data ? JSON.stringify(data).slice(0, 4000) : null },
    });
  } catch {}
}

// Create one PublishingJob per platform for a material.
// scheduledAt = null  -> publish as soon as the queue runs (or immediately).
// scheduledAt = Date  -> the queue runner will pick it up at that time.
export async function createJobsForPost({ post, workspaceId, platforms, scheduledAt = null, userId = null }) {
  const jobs = [];
  for (const platform of [...new Set(platforms)]) {
    const account = await prisma.socialAccount
      .findUnique({ where: { workspaceId_platform: { workspaceId, platform } } })
      .catch(() => null);

    const job = await prisma.publishingJob.create({
      data: {
        workspaceId,
        postId: post.id,
        clientId: post.clientId,
        platform,
        socialAccountId: account?.id || null,
        status: 'pending',
        scheduledAt,
        createdById: userId,
        payload: JSON.stringify({ type: post.type, title: post.title }),
      },
    });
    await logJob(job.id, 'info', scheduledAt ? `Scheduled for ${scheduledAt.toISOString()}` : 'Queued for immediate publish');
    jobs.push(job);
  }

  // Reflect scheduling on the material so the admin timelines show it.
  if (scheduledAt) {
    await prisma.post.update({ where: { id: post.id }, data: { status: 'approved', publishAt: scheduledAt } }).catch(() => {});
  }
  return jobs;
}

// Run a single job through the real pipeline. Honest: fails loudly, no fakes.
export async function processJob(jobId) {
  const job = await prisma.publishingJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, reason: 'missing' };
  if (!['pending', 'retry'].includes(job.status)) return { ok: false, reason: 'not_runnable' };

  const attempt = job.attempts + 1;
  await prisma.publishingJob.update({ where: { id: jobId }, data: { status: 'publishing', attempts: attempt } });
  await logJob(jobId, 'info', `Publishing started (attempt ${attempt}/${job.maxAttempts})`);

  try {
    const account = job.socialAccountId
      ? await prisma.socialAccount.findUnique({ where: { id: job.socialAccountId } })
      : await prisma.socialAccount.findUnique({ where: { workspaceId_platform: { workspaceId: job.workspaceId, platform: job.platform } } }).catch(() => null);

    if (!account || account.status !== 'connected' || !account.accessToken) {
      throw new PublishError('not_connected',
        `لا يوجد حساب ${job.platform} مرتبط أو الجلسة منتهية. اربط الحساب من صفحة «الحسابات المرتبطة».`);
    }

    const publisher = getPublisher(job.platform);
    if (!publisher) throw new PublishError('unsupported', `المنصة ${job.platform} غير مدعومة`);

    let token;
    try { token = decryptSecret(account.accessToken); }
    catch (e) { throw new PublishError('token_error', e.message); }

    const post = await prisma.post.findUnique({ where: { id: job.postId } });
    if (!post) throw new PublishError('post_missing', 'المادة غير موجودة');

    const result = await publisher({ post, account, token, log: (l, m, d) => logJob(jobId, l, m, d) });

    await prisma.publishingJob.update({
      where: { id: jobId },
      data: { status: 'published', externalPostId: result?.externalId || null, externalUrl: result?.externalUrl || null, publishedAt: new Date(), error: null },
    });
    await logJob(jobId, 'info', 'Published successfully', result || {});
    await prisma.post.update({ where: { id: job.postId }, data: { status: 'published', publishAt: new Date() } }).catch(() => {});
    return { ok: true };
  } catch (err) {
    // Retry only transient API errors; configuration/implementation errors fail outright.
    const transient = err.code === 'api_error';
    const willRetry = transient && attempt < job.maxAttempts;
    await prisma.publishingJob.update({
      where: { id: jobId },
      data: { status: willRetry ? 'retry' : 'failed', error: String(err.message).slice(0, 500) },
    });
    await logJob(jobId, 'error', `${err.code ? '[' + err.code + '] ' : ''}${err.message}`);
    return { ok: false, status: willRetry ? 'retry' : 'failed' };
  }
}

// Process a specific set of jobs (used for immediate "Publish now" feedback).
export async function processJobs(ids) {
  const out = [];
  for (const id of ids) out.push({ id, ...(await processJob(id)) });
  return out;
}

// The QUEUE RUNNER: process every job that is due now. Called by the cron
// endpoint (/api/publishing/process) and the "Run queue" button.
export async function processDueJobs({ workspaceId, limit = 25 } = {}) {
  const now = new Date();
  const due = await prisma.publishingJob.findMany({
    where: {
      status: { in: ['pending', 'retry'] },
      ...(workspaceId ? { workspaceId } : {}),
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  const results = [];
  for (const j of due) results.push({ id: j.id, ...(await processJob(j.id)) });
  return { processed: results.length, results };
}
