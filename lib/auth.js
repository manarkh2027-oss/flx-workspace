import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'flx-dev-secret-change-me'
);

export const SESSION_COOKIE = 'flx_session';

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload?.sub) return null;
  return prisma.user.findUnique({
    where: { id: payload.sub },
    include: { client: true },
  });
}
