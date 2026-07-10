import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { SKILL_CODES } from '@/lib/skills';
import type { TokenPayload } from '@/lib/auth';
import type { SkillsResponse } from '@/types';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const rows = await prisma.skillProgress.findMany({
    where: { userId: user.sub },
    select: { skill: true, completedLevel: true },
  });

  const progress = Object.fromEntries(
    SKILL_CODES.map((code) => [code, 0]),
  ) as SkillsResponse['progress'];

  for (const row of rows) {
    if (row.skill in progress) {
      progress[row.skill as keyof typeof progress] = row.completedLevel;
    }
  }

  return NextResponse.json({ progress });
}
