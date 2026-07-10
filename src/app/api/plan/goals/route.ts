import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type PlanGoal, type PlanMediumGoal } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createBigGoalSchema } from '@/lib/validations';
import { buildBigGoalTitle } from '@/lib/plan';
import type { SkillCode } from '@/lib/skills';
import type { TokenPayload } from '@/lib/auth';
import type { PlanBigGoal } from '@/types';

type GoalWithMedium = PlanGoal & { mediumGoals: PlanMediumGoal[] };

function mapGoal(goal: GoalWithMedium): PlanBigGoal {
  return {
    id: goal.id,
    skill: goal.skill as SkillCode,
    level: goal.level,
    title: goal.title,
    completed: goal.completed,
    createdAt: goal.createdAt.toISOString(),
    mediumGoals: goal.mediumGoals.map((m) => ({
      id: m.id,
      title: m.title,
      completed: m.completed,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const goals = await prisma.planGoal.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
    include: { mediumGoals: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ goals: goals.map(mapGoal) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = createBigGoalSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { skill } = parsed.data;

  const progress = await prisma.skillProgress.findUnique({
    where: { userId_skill: { userId: user.sub, skill } },
    select: { completedLevel: true },
  });
  const completed = progress?.completedLevel ?? 0;
  if (completed >= 10) return jsonError(409, 'Skill already complete');
  const level = completed + 1;
  const title = buildBigGoalTitle(skill, level);

  try {
    const goal = await prisma.planGoal.create({
      data: { userId: user.sub, skill, level, title },
      include: { mediumGoals: true },
    });
    return NextResponse.json({ goal: mapGoal(goal), duplicate: false });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const dup = await prisma.planGoal.findFirst({
        where: { userId: user.sub, skill, level, completed: false },
        include: { mediumGoals: { orderBy: { createdAt: 'asc' } } },
      });
      if (dup) return NextResponse.json({ goal: mapGoal(dup), duplicate: true });
    }
    throw e;
  }
}
