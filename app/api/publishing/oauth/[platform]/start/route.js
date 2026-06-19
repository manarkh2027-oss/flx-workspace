import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { canManageClients } from '@/lib/permissions';
import { getPlatform, isPlatformConfigured, redirectUri } from '@/lib/publishing/platforms';
import { appBaseUrl } from '@/lib/appUrl';

// Step 1 of OAuth: redirect the admin to the provider's consent screen.
export async function GET(req, { params }) {
  const user = await getCurrentUser();
  if (!canManageClients(user?.role)) return NextResponse.redirect(new URL('/', req.url));

  const platform = params.platform;
  const p = getPlatform(platform);
  if (!p) return NextResponse.redirect(new URL('/connected-accounts?error=unknown', req.url));

  // Honest: we can't start OAuth without app credentials.
  if (!isPlatformConfigured(platform)) {
    return NextResponse.redirect(new URL(`/connected-accounts?error=not_configured&platform=${platform}`, req.url));
  }

  // CSRF state — stored in a short-lived cookie and verified in the callback.
  const state = crypto.randomBytes(16).toString('hex');
  const clientId = process.env[p.oauth.envClientId];
  const qs = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(appBaseUrl(), platform),
    response_type: 'code',
    scope: p.oauth.scopes.join(' '),
    state,
  });
  // TODO(engineer): X (Twitter) requires PKCE — add code_challenge/code_challenge_method
  // and store the code_verifier in the cookie alongside state.

  const res = NextResponse.redirect(`${p.oauth.authorizeUrl}?${qs.toString()}`);
  res.cookies.set('pub_oauth_state', `${platform}:${state}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
  });
  return res;
}
