import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { updateCardSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const existing = await prisma.card.findFirst({ where: { id, deletedAt: null, deck: { userId: user.sub } } });
  if (!existing) return jsonError(404, 'Card not found');

  const body = await request.json().catch(() => null);
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const card = await prisma.card.update({
    where: { id },
    data: { ...parsed.data, updatedAt: new Date() },
    select: { id: true, deckId: true, front: true, back: true, type: true, tags: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(card);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const existing = await prisma.card.findFirst({ where: { id, deletedAt: null, deck: { userId: user.sub } } });
  if (!existing) return jsonError(404, 'Card not found');

  await prisma.card.update({ where: { id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
