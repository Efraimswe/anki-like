import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { signAccessToken, setAuthCookies } from '@/lib/auth';
import { createSession, parseUserAgent } from '@/lib/session';
import { signUpSchema } from '@/lib/validations';
import { jsonError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  }

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, 'Unable to create account');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName: displayName || null },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });

  const ua = request.headers.get('user-agent');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || null;
  const { session, rawToken } = await createSession(user.id, parseUserAgent(ua), ip);

  const accessToken = await signAccessToken(user.id, session.id);
  const csrfToken = crypto.randomUUID();
  await setAuthCookies(accessToken, rawToken, csrfToken);

  return NextResponse.json({ user });
}
