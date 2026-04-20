import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, signAccessToken, setAuthCookies } from '@/lib/auth';
import { jsonError } from '@/lib/api-utils';
import { isValidLanguageCode } from '@/lib/onboarding/languages';
import { isLevel } from '@/lib/onboarding/levels';
import { GoalsSchema } from '@/lib/onboarding/goals';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  const { nativeLanguage, englishLevel, goals } = body ?? {};

  if (!nativeLanguage || !isValidLanguageCode(nativeLanguage)) {
    return jsonError(400, 'Invalid nativeLanguage');
  }
  if (!englishLevel || !isLevel(englishLevel)) {
    return jsonError(400, 'Invalid englishLevel');
  }
  const goalsParsed = GoalsSchema.safeParse(goals);
  if (!goalsParsed.success) {
    return jsonError(400, goalsParsed.error.issues.map((i) => i.message).join('; '));
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { onboardingCompleted: true, interfaceLanguage: true },
  });
  if (!dbUser) return jsonError(404, 'User not found');
  if (dbUser.onboardingCompleted) return jsonError(409, 'Onboarding already completed');

  await prisma.user.update({
    where: { id: user.sub },
    data: {
      nativeLanguage,
      englishLevel,
      goals: goalsParsed.data,
      onboardingCompleted: true,
      interfaceLanguage: nativeLanguage,
    },
  });

  // Re-issue JWT with updated onboarding claim
  const accessToken = await signAccessToken(user.sub, user.sid, true);
  const csrfToken = crypto.randomUUID();
  const refreshToken = request.cookies.get('refresh_token')?.value || '';
  await setAuthCookies(accessToken, refreshToken, csrfToken);

  return NextResponse.json({ ok: true });
}
