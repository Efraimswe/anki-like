import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { signAccessToken, setAuthCookies } from '@/lib/auth';
import { createSession, parseUserAgent } from '@/lib/session';
import { signInSchema } from '@/lib/validations';
import { jsonError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return jsonError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return jsonError(401, 'Invalid email or password');
  }

  const ua = request.headers.get('user-agent');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || null;
  const { session, rawToken } = await createSession(user.id, parseUserAgent(ua), ip);

  const accessToken = await signAccessToken(user.id, session.id);
  const csrfToken = crypto.randomUUID();
  await setAuthCookies(accessToken, rawToken, csrfToken);

  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt },
  });
}
