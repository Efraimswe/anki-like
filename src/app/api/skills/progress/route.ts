import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { skillProgressSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = skillProgressSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { skill, level, action } = parsed.data;

  const ok = (completedLevel: number) =>
    NextResponse.json({ skill, completedLevel });

  if (action === 'complete') {
    const prev = level - 1; // 0..9
    const res = await prisma.skillProgress.updateMany({
      where: { userId: user.sub, skill, completedLevel: prev },
      data: { completedLevel: level },
    });
    if (res.count === 1) return ok(level);
    // строки нет (первое прохождение навыка) — создать только если это уровень 1
    if (prev === 0) {
      try {
        await prisma.skillProgress.create({ data: { userId: user.sub, skill, completedLevel: level } });
        return ok(level);
      } catch {
        /* unique-нарушение => строка уже есть, значит нарушена последовательность */
      }
    }
    return jsonError(409, 'Levels must be completed in order');
  }

  // action === 'uncomplete'
  const res = await prisma.skillProgress.updateMany({
    where: { userId: user.sub, skill, completedLevel: level }, // откатить можно только текущий верх
    data: { completedLevel: level - 1 },
  });
  if (res.count === 1) return ok(level - 1);
  return jsonError(409, 'You can only undo your current level');
}
