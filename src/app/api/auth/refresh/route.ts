import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken, setAuthCookies } from '@/lib/auth';
import { findSessionByRefreshToken, rotateRefreshToken } from '@/lib/session';
import { jsonError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return jsonError(401, 'Invalid refresh token');
  }

  const session = await findSessionByRefreshToken(refreshToken);
  if (!session || session.expiresAt < new Date()) {
    return jsonError(401, 'Invalid refresh token');
  }

  const newRawToken = await rotateRefreshToken(session.id);
  const accessToken = await signAccessToken(session.userId, session.id);
  const csrfToken = crypto.randomUUID();
  await setAuthCookies(accessToken, newRawToken, csrfToken);

  return NextResponse.json({ accessToken });
}
