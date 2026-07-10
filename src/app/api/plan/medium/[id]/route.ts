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
    const owned = await prisma.planMediumGoal.findFirst({
      where: { id, bigGoal: { userId: user.sub } },
      select: { id: true },
    });
    if (!owned) return jsonError(404, 'Goal not found');
    await prisma.planMediumGoal.update({ where: { id }, data: { title } });
    return NextResponse.json({ id, title });
  }

  const parsed = toggleGoalSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');
  const { completed } = parsed.data;

  const owned = await prisma.planMediumGoal.findFirst({
    where: { id, bigGoal: { userId: user.sub } },
    select: { id: true },
  });
  if (!owned) return jsonError(404, 'Goal not found');

  await prisma.planMediumGoal.update({ where: { id }, data: { completed } });

  return NextResponse.json({ id, completed });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const owned = await prisma.planMediumGoal.findFirst({
    where: { id, bigGoal: { userId: user.sub } },
    select: { id: true },
  });
  if (!owned) return jsonError(404, 'Goal not found');

  await prisma.planMediumGoal.delete({ where: { id } });

  return NextResponse.json({ id });
}
