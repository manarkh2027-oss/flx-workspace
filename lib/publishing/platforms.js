// Central registry for every supported social platform.
//
// Each entry documents the OFFICIAL OAuth + publishing endpoints a professional
// engineer must wire up. The `env*` keys name the environment variables that
// hold the app credentials you get after registering a developer app with each
// provider. Nothing here invents fake behaviour — when the credentials or a
// connected account are missing, the publishing pipeline fails honestly.

export const PLATFORMS = {
  facebook: {
    key: 'facebook',
    en: 'Facebook',
    ar: 'فيسبوك',
    icon: 'ti-brand-facebook',
    color: '#1877F2',
    // Facebook Login + Pages publishing (Graph API).
    oauth: {
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'business_management'],
      envClientId: 'FACEBOOK_APP_ID',
      envClientSecret: 'FACEBOOK_APP_SECRET',
    },
    docs: 'https://developers.facebook.com/docs/pages-api/posts',
    accepts: ['image', 'video', 'copy', 'design'],
  },
  instagram: {
    key: 'instagram',
    en: 'Instagram',
    ar: 'إنستغرام',
    icon: 'ti-brand-instagram',
    color: '#E1306C',
    // Instagram Graph API (requires an IG Business account linked to a FB Page).
    oauth: {
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
      envClientId: 'FACEBOOK_APP_ID',
      envClientSecret: 'FACEBOOK_APP_SECRET',
    },
    docs: 'https://developers.facebook.com/docs/instagram-api/guides/content-publishing',
    accepts: ['image', 'video', 'design'],
  },
  linkedin: {
    key: 'linkedin',
    en: 'LinkedIn',
    ar: 'لينكد إن',
    icon: 'ti-brand-linkedin',
    color: '#0A66C2',
    oauth: {
      authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['w_member_social', 'r_liteprofile', 'w_organization_social'],
      envClientId: 'LINKEDIN_CLIENT_ID',
      envClientSecret: 'LINKEDIN_CLIENT_SECRET',
    },
    docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/posts-api',
    accepts: ['image', 'video', 'copy', 'design'],
  },
  tiktok: {
    key: 'tiktok',
    en: 'TikTok',
    ar: 'تيك توك',
    icon: 'ti-brand-tiktok',
    color: '#010101',
    // TikTok Content Posting API (Direct Post).
    oauth: {
      authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      scopes: ['video.publish', 'video.upload', 'user.info.basic'],
      envClientId: 'TIKTOK_CLIENT_KEY',
      envClientSecret: 'TIKTOK_CLIENT_SECRET',
    },
    docs: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    accepts: ['video'],
  },
  youtube: {
    key: 'youtube',
    en: 'YouTube',
    ar: 'يوتيوب',
    icon: 'ti-brand-youtube',
    color: '#FF0000',
    // YouTube Data API v3 (videos.insert) via Google OAuth.
    oauth: {
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
      envClientId: 'GOOGLE_CLIENT_ID',
      envClientSecret: 'GOOGLE_CLIENT_SECRET',
    },
    docs: 'https://developers.google.com/youtube/v3/docs/videos/insert',
    accepts: ['video'],
  },
  x: {
    key: 'x',
    en: 'X (Twitter)',
    ar: 'إكس',
    icon: 'ti-brand-x',
    color: '#000000',
    // X API v2 (tweets) with OAuth 2.0 PKCE.
    oauth: {
      authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      envClientId: 'X_CLIENT_ID',
      envClientSecret: 'X_CLIENT_SECRET',
    },
    docs: 'https://developer.x.com/en/docs/x-api/tweets/manage-tweets/introduction',
    accepts: ['image', 'video', 'copy', 'design'],
  },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

export function getPlatform(key) {
  return PLATFORMS[key] || null;
}

// True only when the app credentials for a platform are present in the env.
// Used to tell the admin which integrations are ready to be connected.
export function isPlatformConfigured(key) {
  const p = PLATFORMS[key];
  if (!p) return false;
  return Boolean(process.env[p.oauth.envClientId] && process.env[p.oauth.envClientSecret]);
}

// The redirect URI registered with each provider (must match exactly).
export function redirectUri(appUrl, key) {
  const base = (appUrl || '').replace(/\/$/, '');
  return `${base}/api/publishing/oauth/${key}/callback`;
}
