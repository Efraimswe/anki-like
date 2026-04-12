import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { getLimits, getCounters } from '@/lib/daily-limits';
import { previewIntervals, type CardState } from '@/lib/sm2';
import type { TokenPayload } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { deckId } = await params;

  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId: user.sub, deletedAt: null }, select: { id: true } });
  if (!deck) return jsonError(404, 'Deck not found');

  const limits = await getLimits(user.sub);
  const counters = await getCounters(user.sub);

  const remainingNew = Math.max(0, limits.maxNewCards - counters.todayNewCount);
  const remainingReviews = Math.max(0, limits.maxReviews - counters.todayReviewCount);

  if (remainingReviews === 0) {
    return NextResponse.json({ cards: [], remainingNew: 0, remainingReviews: 0, nextDueDate: null });
  }

  const effectiveLimit = Math.min(50, remainingReviews);
  const now = new Date();
  const learningCutoff = new Date(Date.now() + 20 * 60 * 1000);

  const reviewCards = await prisma.card.findMany({
    where: {
      deckId, deletedAt: null, deck: { userId: user.sub },
      cardState: {
        phase: { not: 'new' },
        OR: [
          { dueDate: { lte: now } },
          { phase: { in: ['learning', 'relearning'] }, dueDate: { lte: learningCutoff } },
        ],
      },
    },
    orderBy: { cardState: { dueDate: 'asc' } },
    take: effectiveLimit,
    select: {
      id: true, front: true, back: true, type: true,
      cardState: { select: { phase: true, dueDate: true, interval: true, easeFactor: true, repetitions: true, learningStep: true } },
    },
  });

  const newLimit = Math.min(remainingNew, effectiveLimit - reviewCards.length);
  let newCards: typeof reviewCards = [];
  if (newLimit > 0) {
    newCards = await prisma.card.findMany({
      where: { deckId, deletedAt: null, deck: { userId: user.sub }, cardState: { phase: 'new' } },
      orderBy: { createdAt: 'asc' },
      take: newLimit,
      select: {
        id: true, front: true, back: true, type: true,
        cardState: { select: { phase: true, dueDate: true, interval: true, easeFactor: true, repetitions: true, learningStep: true } },
      },
    });
  }

  const allCards = [...reviewCards, ...newCards].map((c) => {
    const cs = c.cardState!;
    const state: CardState = {
      interval: cs.interval, easeFactor: cs.easeFactor, repetitions: cs.repetitions,
      phase: cs.phase as CardState['phase'], learningStep: cs.learningStep,
    };
    return {
      id: c.id, front: c.front, back: c.back, type: c.type,
      phase: cs.phase, dueDate: cs.dueDate,
      intervalHints: previewIntervals(state),
    };
  });

  const nextDueCard = await prisma.card.findFirst({
    where: { deckId, deletedAt: null, deck: { userId: user.sub }, cardState: { dueDate: { gt: now } } },
    orderBy: { cardState: { dueDate: 'asc' } },
    select: { cardState: { select: { dueDate: true } } },
  });

  return NextResponse.json({
    cards: allCards,
    remainingNew: remainingNew - newCards.length,
    remainingReviews: remainingReviews - allCards.length,
    nextDueDate: nextDueCard?.cardState?.dueDate || null,
  });
}
