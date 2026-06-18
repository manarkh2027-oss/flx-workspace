import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessClient } from '@/lib/access';
import { canApprove } from '@/lib/permissions';
import { STATUS, TYPE, PLATFORM, initialsOf } from '@/lib/ui';
import ReviewActions from '@/components/ReviewActions';
import ReviewComposer from '@/components/ReviewComposer';

export const dynamic = 'force-dynamic';

const ROLE = {
  client: { en: 'Client', ar: 'عميل' },
  editor: { en: 'Editor', ar: 'محرر' },
  designer: { en: 'Designer', ar: 'مصممة' },
  account_manager: { en: 'Account mgr', ar: 'مدير حساب' },
  super_admin: { en: 'Admin', ar: 'مشرف' },
};

export default async function PostPage({ params }) {
  const user = await getCurrentUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      campaign: true,
    },
  });

  // Hard isolation: the post must belong to a client this user can access.
  if (!post || !(await canAccessClient(user, post.clientId))) notFound();

  const t = TYPE[post.type] || TYPE.copy;
  const s = STATUS[post.status] || STATUS.review;
  const allowApprove = canApprove(user.role);
  const avatarColors = ['', 'a2', 'a3', 'a4', 'a5'];

  return (
    <div className="review-grid">
      <section className="stage">
        <div className="stage-inner">
          <div className="stage-head">
            <div>
              <div className="ttl"><i className={'ti ' + t.icon} style={{ color: 'var(--brand)' }} /> <span data-ar={post.titleAr || undefined}>{post.title}</span></div>
              <div className="meta">
                <span className={'badge ' + s.badge} style={{ height: 20 }}><span data-ar={t.ar}>{t.en}</span></span>
                <span className="sep" />
                <span data-ar={post.dayAr || undefined}>{post.dayEn}</span>
                {post.campaign && (<><span className="sep" /><span data-ar={post.campaign.nameAr || undefined}>{post.campaign.name}</span></>)}
              </div>
            </div>
            <span className={'badge ' + s.badge} style={{ height: 28, fontSize: 12.5 }}><span className="dot" /> <span data-ar={s.ar}>{s.en}</span></span>
          </div>

          {post.type === 'copy' ? (
            <div className="player copybg" dir="auto">{post.body || '—'}</div>
          ) : post.mediaUrl && post.type === 'video' ? (
            <video className="player" src={post.mediaUrl} controls playsInline preload="metadata" poster={post.posterUrl || undefined} />
          ) : post.mediaUrl ? (
            <img className="player" src={post.mediaUrl} alt={post.title} />
          ) : (
            <div className="player">
              <span className="corner l"><i className="ti ti-versions" style={{ verticalAlign: -2 }} /> <span data-ar={`النسخة ${post.version}`}>{`Version ${post.version}`}</span></span>
              <div className="center"><span className="play"><i className={'ti ' + (post.type === 'video' ? 'ti-player-play' : 'ti-photo')} /></span></div>
            </div>
          )}

          <div className="vbar">
            <div className="versions">
              <span className="vtab active"><span className="tagdot" style={{ background: 'var(--brand)' }} />{`v${post.version} · `}<span data-ar="الحالية">current</span></span>
            </div>
            <span className="hint" style={{ fontSize: 12.5 }} data-ar={`${post.comments.length} تعليقات`}>{`${post.comments.length} comments`}</span>
          </div>

          <div className="decision">
            <div className="status">
              <span className="badge badge--gray"><i className="ti ti-shield-check" style={{ fontSize: 13 }} /> <span data-ar="اجتاز الفحص الداخلي">Passed internal QA</span></span>
              {allowApprove && <span className="lbl" data-ar="اعتمادك هو الخطوة الأخيرة">Your sign-off is the final step</span>}
            </div>
            {allowApprove ? (
              <ReviewActions postId={post.id} />
            ) : (
              <div className="approve-note"><i className="ti ti-info-circle" /> <span data-ar="الاعتماد النهائي من صلاحية العميل">Final approval is the client's to give</span></div>
            )}
          </div>
        </div>
      </section>

      <aside className="panel">
        <div className="panel-tabs">
          <span className="ptab active"><i className="ti ti-message-circle" /> <span data-ar="التعليقات">Comments</span> <span className="n">{post.comments.length}</span></span>
        </div>

        <div className="panel-body">
          {post.comments.length === 0 && (
            <p className="hint" data-ar="لا توجد تعليقات بعد. كن أول من يعلّق.">No comments yet. Be the first to comment.</p>
          )}
          {post.comments.map((c, i) => {
            const r = ROLE[c.author.role] || { en: c.author.role, ar: c.author.role };
            return (
              <div className="comment" key={c.id}>
                <span className={'avatar ' + avatarColors[i % avatarColors.length]}>{initialsOf(c.author.fullName)}</span>
                <div className="body">
                  <div className="hd">
                    <span className="nm">{c.author.fullName}</span>
                    <span className="role" data-ar={r.ar}>{r.en}</span>
                  </div>
                  <div className="tx" dir="auto">{c.body}</div>
                </div>
              </div>
            );
          })}
        </div>

        <ReviewComposer postId={post.id} />
      </aside>
    </div>
  );
}
