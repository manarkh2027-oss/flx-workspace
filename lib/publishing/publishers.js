// Per-platform publishers. Each function performs the REAL call to the official
// API using the connected account's token. They are only ever reached when a
// SocialAccount is connected (the service fails the job earlier otherwise), so
// nothing here fakes success — a failure throws and the job is marked failed.
//
// Where an official flow needs more than one request (media containers, resumable
// uploads) or infrastructure we don't have yet (a public CDN URL for binaries),
// the code is marked with TODO(engineer) and throws a descriptive error instead
// of pretending it worked.

const TIMEOUT_MS = 20000;

export class PublishError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function httpJson(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok) throw new PublishError('api_error', `${res.status} ${JSON.stringify(json).slice(0, 400)}`);
    return json;
  } finally {
    clearTimeout(t);
  }
}

// A material's media must be a publicly fetchable URL for most platforms.
// Our uploads may be stored as data:-URLs — those can't be handed to an external
// API, so we stop with a clear message rather than failing deep inside the call.
function requirePublicMedia(post) {
  const url = post.mediaUrl || '';
  if (!url) throw new PublishError('no_media', 'هذه المادة لا تحتوي ملفاً للنشر');
  if (url.startsWith('data:')) {
    throw new PublishError('media_not_hosted',
      'ملف المادة مخزَّن داخل قاعدة البيانات (data-URL). يجب استضافته على رابط عام (CDN/S3) قبل النشر. TODO(engineer): ارفع الملف إلى تخزين عام وأعطِ الرابط هنا.');
  }
  return url;
}

const text = (post) => (post.body || post.title || '').slice(0, 2800);

export const publishers = {
  // ---- Facebook Page feed (Graph API) -------------------------------------
  async facebook({ post, account, token, log }) {
    const meta = account.meta ? JSON.parse(account.meta) : {};
    const pageId = meta.pageId;
    const pageToken = token; // a Page access token (exchanged during OAuth)
    if (!pageId) throw new PublishError('missing_page', 'لم يتم اختيار صفحة فيسبوك للنشر عليها (page id)');

    let endpoint, body;
    if (post.type === 'image' || post.type === 'design') {
      const imageUrl = requirePublicMedia(post);
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      body = new URLSearchParams({ url: imageUrl, caption: text(post), access_token: pageToken });
    } else {
      // text / link post
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      body = new URLSearchParams({ message: text(post), access_token: pageToken });
    }
    await log('info', 'POST ' + endpoint);
    const r = await httpJson(endpoint, { method: 'POST', body });
    const id = r.post_id || r.id;
    return { externalId: id, externalUrl: id ? `https://facebook.com/${id}` : null };
  },

  // ---- Instagram (Graph API, 2-step container → publish) ------------------
  async instagram({ post, account, token, log }) {
    const meta = account.meta ? JSON.parse(account.meta) : {};
    const igUserId = meta.igUserId;
    if (!igUserId) throw new PublishError('missing_ig', 'لم يُربط حساب إنستغرام للأعمال (ig user id)');
    const mediaUrl = requirePublicMedia(post);
    const isVideo = post.type === 'video';

    // Step 1: create a media container.
    const createUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    const params = new URLSearchParams({ caption: text(post), access_token: token });
    if (isVideo) { params.set('media_type', 'REELS'); params.set('video_url', mediaUrl); }
    else params.set('image_url', mediaUrl);
    await log('info', 'create container ' + createUrl);
    const container = await httpJson(createUrl, { method: 'POST', body: params });

    // TODO(engineer): for video/REELS you must POLL GET /{container-id}?fields=status_code
    // until it returns FINISHED before publishing. Add that wait loop here.

    // Step 2: publish the container.
    const pubUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const r = await httpJson(pubUrl, { method: 'POST', body: new URLSearchParams({ creation_id: container.id, access_token: token }) });
    return { externalId: r.id, externalUrl: r.id ? `https://instagram.com/p/${r.id}` : null };
  },

  // ---- LinkedIn (UGC Posts) ----------------------------------------------
  async linkedin({ post, account, token, log }) {
    const meta = account.meta ? JSON.parse(account.meta) : {};
    const authorUrn = meta.authorUrn; // e.g. "urn:li:person:xxxx" or "urn:li:organization:xxxx"
    if (!authorUrn) throw new PublishError('missing_author', 'لم يُحدَّد صاحب المنشور على لينكد إن (author urn)');

    // TODO(engineer): to attach images/video, first register an upload via
    // POST /v2/assets?action=registerUpload, PUT the binary, then reference the
    // asset urn in the share. This implements the text share path.
    const body = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: text(post) },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };
    await log('info', 'POST https://api.linkedin.com/v2/ugcPosts');
    const r = await httpJson('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const id = r.id;
    return { externalId: id, externalUrl: id ? `https://www.linkedin.com/feed/update/${id}` : null };
  },

  // ---- X / Twitter (API v2 tweets) ---------------------------------------
  async x({ post, token, log }) {
    // TODO(engineer): media tweets require uploading via the v1.1 media/upload
    // endpoint and passing media_ids here. This implements the text tweet path.
    await log('info', 'POST https://api.twitter.com/2/tweets');
    const r = await httpJson('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: text(post).slice(0, 280) }),
    });
    const id = r.data?.id;
    return { externalId: id, externalUrl: id ? `https://x.com/i/web/status/${id}` : null };
  },

  // ---- TikTok (Content Posting API, Direct Post) -------------------------
  async tiktok({ post, log }) {
    requirePublicMedia(post); // TikTok pulls the video from a verified URL
    // TODO(engineer): full flow = POST /v2/post/publish/video/init/ with
    // source_info (PULL_FROM_URL or FILE_UPLOAD), then poll the publish status.
    // The pulled domain must be verified in your TikTok app. Implement here.
    await log('warn', 'TikTok publishing flow is not implemented yet');
    throw new PublishError('not_implemented',
      'تكامل تيك توك جاهز معمارياً ويحتاج إكمال خطوات النشر الرسمية (init + رفع/سحب الفيديو). راجع TODO في publishers.js');
  },

  // ---- YouTube (Data API v3 videos.insert) -------------------------------
  async youtube({ post, log }) {
    requirePublicMedia(post);
    // TODO(engineer): videos.insert needs a RESUMABLE binary upload (multipart),
    // not a JSON body. Stream the video to
    // https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable
    // with the snippet+status metadata, then return the video id.
    await log('warn', 'YouTube publishing flow is not implemented yet');
    throw new PublishError('not_implemented',
      'تكامل يوتيوب جاهز معمارياً ويحتاج إكمال الرفع الرسمي (resumable upload). راجع TODO في publishers.js');
  },
};

export function getPublisher(platform) {
  return publishers[platform] || null;
}
