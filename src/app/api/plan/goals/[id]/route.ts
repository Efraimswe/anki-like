import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { toggleGoalSchema, updateGoalTitleSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const body = await request.json().catch(() => null);

  if (body && typeof body === 'object' && 'title' in body) {
    const parsed = updateGoalTitleSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
    const { title } = parsed.data;
    const res = await prisma.planGoal.updateMany({ where: { id, userId: user.sub }, data: { title } });
    if (res.count === 0) return jsonError(404, 'Goal not found');
    return NextResponse.json({ id, title });
  }

  const parsed = toggleGoalSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { completed } = parsed.data;

  const res = await prisma.planGoal.updateMany({
    where: { id, userId: user.sub },
    data: { completed },
  });
  if (res.count === 0) return jsonError(404, 'Goal not found');

  // Big goals are born from skill levels: completing the goal advances the
  // linked level, un-completing rolls it back. Same race-safe conditional
  // updates as /api/skills/progress — out-of-order states are left unchanged.
  const goal = await prisma.planGoal.findFirst({
    where: { id, userId: user.sub },
    select: { skill: true, level: true },
  });
  if (goal) {
    if (completed) {
      const prev = goal.level - 1;
      const upd = await prisma.skillProgress.updateMany({
        where: { userId: user.sub, skill: goal.skill, completedLevel: prev },
        data: { completedLevel: goal.level },
      });
      if (upd.count === 0 && prev === 0) {
        try {
          await prisma.skillProgress.create({
            data: { userId: user.sub, skill: goal.skill, completedLevel: 1 },
          });
        } catch {
          // row already exists → progress isn't at 0 → nothing to advance
        }
      }
    } else {
      await prisma.skillProgress.updateMany({
        where: { userId: user.sub, skill: goal.skill, completedLevel: goal.level },
        data: { completedLevel: goal.level - 1 },
      });
    }
  }

  return NextResponse.json({ id, completed });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const res = await prisma.planGoal.deleteMany({ where: { id, userId: user.sub } });
  if (res.count === 0) return jsonError(404, 'Goal not found');

  return NextResponse.json({ id });
}
