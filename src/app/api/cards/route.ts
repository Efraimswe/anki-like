import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { createCardSchema } from '@/lib/validations';
import { getNow } from '@/lib/clock';
import { startOfDay } from '@/lib/daily';
import type { TokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const { deckId, word, translate } = parsed.data;

  // Verify deck ownership
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId: user.sub, deletedAt: null },
    select: { dailyAddLimit: true },
  });
  if (!deck) return jsonError(404, 'Deck not found');

  // Enforce the daily cards-created cap (counts all cards added to this deck today, Brussels time)
  const addedToday = await prisma.card.count({
    where: { deckId, createdAt: { gte: startOfDay(getNow()) } },
  });
  if (addedToday >= deck.dailyAddLimit) {
    return jsonError(429, `Daily limit reached — you can add up to ${deck.dailyAddLimit} cards per day to this deck.`);
  }

  const card = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const c = await tx.card.create({
      data: { deckId, word, translate },
      select: { id: true, deckId: true, word: true, translate: true, createdAt: true },
    });
    await tx.cardState.create({ data: { cardId: c.id } });
    return c;
  });

  return NextResponse.json(card, { status: 201 });
}
