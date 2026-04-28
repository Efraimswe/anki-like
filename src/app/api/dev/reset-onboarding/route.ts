import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthUser, signAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.sub },
    data: { onboardingCompleted: false, nativeLanguage: null, skillLevels: Prisma.JsonNull, goals: Prisma.JsonNull },
  });

  const newToken = await signAccessToken(user.sub, user.sid, false);
  const cookieStore = await cookies();
  cookieStore.set('access_token', newToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });

  return NextResponse.json({ ok: true });
}
