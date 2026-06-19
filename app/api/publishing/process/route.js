import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';
import { processDueJobs } from '@/lib/publishing/service';

// THE QUEUE RUNNER.
// Two ways to call it:
//  1) A scheduled cron (recommended for processing SCHEDULED jobs at their time).
//     Configure a Render Cron Job / external scheduler to POST here every minute
//     with header  x-cron-secret: $PUBLISHING_CRON_SECRET
//  2) An admin clicking "Run queue now" in the Publishing Center (session auth).
export async function POST(req) {
  const cronSecret = process.env.PUBLISHING_CRON_SECRET;
  const provided = req.headers.get('x-cron-secret');
  const viaCron = cronSecret && provided && provided === cronSecret;

  let workspaceId;
  if (!viaCron) {
    const user = await getCurrentUser();
    if (!canManageClients(user?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    workspaceId = user.workspaceId; // admins only process their own workspace
  }

  const summary = await processDueJobs({ workspaceId });
  return NextResponse.json({ ok: true, ...summary });
}
