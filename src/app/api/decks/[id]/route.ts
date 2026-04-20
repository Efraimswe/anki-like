import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { updateDeckSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const deck = await prisma.deck.findFirst({
    where: { id, userId: user.sub, deletedAt: null },
    include: {
      cards: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, front: true, back: true, type: true, tags: true, createdAt: true, updatedAt: true, deckId: true },
      },
    },
  });

  if (!deck) return jsonError(404, 'Deck not found');

  return NextResponse.json({
    id: deck.id,
    name: deck.name,
    cardCount: deck.cards.length,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    cards: deck.cards,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateDeckSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const existing = await prisma.deck.findFirst({ where: { id, userId: user.sub, deletedAt: null } });
  if (!existing) return jsonError(404, 'Deck not found');

  const deck = await prisma.deck.update({
    where: { id },
    data: { name: parsed.data.name, updatedAt: new Date() },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(deck);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  const now = new Date();
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.card.updateMany({
      where: { deckId: id, deck: { userId: user.sub }, deletedAt: null },
      data: { deletedAt: now },
    });
    return tx.deck.updateMany({
      where: { id, userId: user.sub, deletedAt: null },
      data: { deletedAt: now },
    });
  });

  if (result.count === 0) return jsonError(404, 'Deck not found');
  return new NextResponse(null, { status: 204 });
}
