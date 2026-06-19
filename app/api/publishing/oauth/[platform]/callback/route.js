import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';
import { getPlatform, isPlatformConfigured, redirectUri } from '@/lib/publishing/platforms';
import { encryptSecret } from '@/lib/publishing/crypto';
import { appBaseUrl } from '@/lib/appUrl';

// Step 2 of OAuth: the provider redirects back here with ?code=... We exchange
// the code for tokens and store the connected account (tokens encrypted).
export async function GET(req, { params }) {
  const user = await getCurrentUser();
  const back = (q) => NextResponse.redirect(new URL(`/connected-accounts?${q}`, req.url));
  if (!canManageClients(user?.role)) return NextResponse.redirect(new URL('/', req.url));

  const platform = params.platform;
  const p = getPlatform(platform);
  if (!p) return back('error=unknown');

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  if (oauthError) return back(`error=denied&platform=${platform}`);

  // Verify CSRF state.
  const cookie = cookies().get('pub_oauth_state')?.value || '';
  if (!state || cookie !== `${platform}:${state}`) return back(`error=bad_state&platform=${platform}`);
  if (!isPlatformConfigured(platform)) return back(`error=not_configured&platform=${platform}`);
  if (!code) return back(`error=no_code&platform=${platform}`);

  try {
    // ---- Exchange the authorization code for an access token --------------
    // TODO(engineer): each provider differs slightly:
    //  - Facebook/Instagram: GET token endpoint; then exchange a short-lived for
    //    a long-lived token, and fetch the Page token + IG business user id.
    //  - Google/YouTube: standard POST; store refresh_token (offline access).
    //  - LinkedIn: standard POST; fetch the member/organization URN.
    //  - X: POST with PKCE code_verifier + HTTP Basic client auth.
    //  - TikTok: POST to open.tiktokapis.com; store open_id.
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env[p.oauth.envClientId],
      client_secret: process.env[p.oauth.envClientSecret],
      redirect_uri: redirectUri(appBaseUrl(), platform),
    });
    const tokenRes = await fetch(p.oauth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    });
    const token = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !token.access_token) {
      return back(`error=token_exchange&platform=${platform}`);
    }

    // TODO(engineer): fetch the account identity here (page id / IG user id /
    // channel id / member urn) and store it in `meta` so publishers can target it.
    const meta = {};
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;

    await prisma.socialAccount.upsert({
      where: { workspaceId_platform: { workspaceId: user.workspaceId, platform } },
      update: {
        status: 'connected',
        accessToken: encryptSecret(token.access_token),
        refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        scopes: p.oauth.scopes.join(' '),
        meta: JSON.stringify(meta),
        connectedById: user.id,
      },
      create: {
        workspaceId: user.workspaceId, platform, status: 'connected',
        accessToken: encryptSecret(token.access_token),
        refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        scopes: p.oauth.scopes.join(' '),
        meta: JSON.stringify(meta),
        connectedById: user.id,
      },
    });

    const res = back(`connected=${platform}`);
    res.cookies.set('pub_oauth_state', '', { path: '/', maxAge: 0 });
    return res;
  } catch (e) {
    return back(`error=exception&platform=${platform}`);
  }
}
