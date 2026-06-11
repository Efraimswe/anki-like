import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { updateDeckSchema } from '@/lib/validations';
import { getNow } from '@/lib/clock';
import { startOfDay, dayKey } from '@/lib/daily';
import { countDueForReview } from '@/lib/due';
import type { TokenPayload } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { id } = await params;

  // Same Brussels-day boundary used to enforce the daily limits, so the
  // displayed counts always agree with what the add/review caps actually block.
  const now = getNow();
  const dayStart = startOfDay(now); // instant, for createdAt comparison
  const counterDate = dayKey(now); // calendar-date key for the daily counter
  const [deck, addedToday, counter] = await Promise.all([
    prisma.deck.findFirst({
      where: { id, userId: user.sub, deletedAt: null },
      include: {
        cards: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            word: true,
            translate: true,
            createdAt: true,
            updatedAt: true,
            deckId: true,
            cardState: { select: { phase: true, dueDate: true } },
          },
        },
      },
    }),
    prisma.card.count({ where: { deckId: id, createdAt: { gte: dayStart } } }),
    prisma.deckDailyCounter.findUnique({
      where: { deckId_date: { deckId: id, date: counterDate } },
      select: { reviewCount: true },
    }),
  ]);

  if (!deck) return jsonError(404, 'Deck not found');

  const dueCount = countDueForReview(deck.cards.map((c) => c.cardState), now);

  return NextResponse.json({
    id: deck.id,
    name: deck.name,
    dailyReviewLimit: deck.dailyReviewLimit,
    dailyAddLimit: deck.dailyAddLimit,
    cardCount: deck.cards.length,
    dueCount,
    addedToday,
    reviewedToday: counter?.reviewCount ?? 0,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    cards: deck.cards.map((c) => ({
      id: c.id,
      deckId: c.deckId,
      word: c.word,
      translate: c.translate,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
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
    data: { ...parsed.data, updatedAt: new Date() },
    select: { id: true, name: true, dailyReviewLimit: true, dailyAddLimit: true, createdAt: true, updatedAt: true },
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
