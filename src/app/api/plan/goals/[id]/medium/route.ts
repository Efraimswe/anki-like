import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createMediumGoalSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = createMediumGoalSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { title } = parsed.data;

  const big = await prisma.planGoal.findFirst({ where: { id, userId: user.sub }, select: { id: true } });
  if (!big) return jsonError(404, 'Goal not found');

  const medium = await prisma.planMediumGoal.create({ data: { bigGoalId: id, title } });

  return NextResponse.json({
    medium: {
      id: medium.id,
      title: medium.title,
      completed: medium.completed,
      createdAt: medium.createdAt.toISOString(),
    },
  });
}
