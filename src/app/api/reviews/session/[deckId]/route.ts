import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { getIntervalHints } from '@/lib/fsrs';
import { materializeFsrsState } from '@/lib/fsrs-migration';
import { addMinutes, getNow } from '@/lib/clock';
import { dayKey, endOfDay, startOfDay } from '@/lib/daily';
import type { TokenPayload } from '@/lib/auth';

const cardSelect = {
  id: true,
  word: true,
  translate: true,
  cardState: {
    select: {
      phase: true,
      dueDate: true,
      interval: true,
      learningStep: true,
      stability: true,
      difficulty: true,
      scheduledDays: true,
      reps: true,
      lapses: true,
      lastReview: true,
    },
  },
  reviewLogs: {
    orderBy: { reviewedAt: 'asc' as const },
    select: { rating: true, reviewedAt: true },
  },
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;
  const { deckId } = await params;

  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId: user.sub, deletedAt: null },
    select: { id: true, dailyReviewLimit: true },
  });
  if (!deck) return jsonError(404, 'Deck not found');

  const now = getNow();
  const counter = await prisma.deckDailyCounter.findUnique({
    where: { deckId_date: { deckId, date: dayKey(now) } },
    select: { reviewCount: true },
  });
  const remainingReviews = Math.max(0, deck.dailyReviewLimit - (counter?.reviewCount ?? 0));

  const learningCutoff = addMinutes(now, 20);
  const endOfToday = endOfDay(now);
  const startToday = startOfDay(now);

  // In-progress cards: already reviewed today and back for another learning step
  // (after Again/Hard). Always available — repeats don't consume the daily limit,
  // so you can finish a word you started even after the day's quota is spent.
  const inProgressCards = await prisma.card.findMany({
    where: {
      deckId,
      deletedAt: null,
      deck: { userId: user.sub },
      cardState: {
        phase: { in: ['learning', 'relearning'] },
        dueDate: { lte: learningCutoff },
        lastReview: { gte: startToday },
      },
    },
    orderBy: { cardState: { dueDate: 'asc' } },
    take: 50,
    select: cardSelect,
  });

  // Fresh cards not yet touched today — these are what the daily limit gates.
  const gatedLimit = Math.min(50, remainingReviews);
  let reviewCards: typeof inProgressCards = [];
  let newCards: typeof inProgressCards = [];
  if (gatedLimit > 0) {
    reviewCards = await prisma.card.findMany({
      where: {
        deckId,
        deletedAt: null,
        deck: { userId: user.sub },
        cardState: {
          // Exclude cards already reviewed today (served above, uncapped).
          NOT: { lastReview: { gte: startToday } },
          OR: [
            // Review cards: day granularity — due today (local) or earlier, so they
            // become available at local midnight regardless of their time-of-day stamp.
            { phase: 'review', dueDate: { lt: endOfToday } },
            // Learning / relearning carried over from before today (overdue included).
            { phase: { in: ['learning', 'relearning'] }, dueDate: { lte: learningCutoff } },
          ],
        },
      },
      orderBy: { cardState: { dueDate: 'asc' } },
      take: gatedLimit,
      select: cardSelect,
    });

    const newLimit = gatedLimit - reviewCards.length;
    if (newLimit > 0) {
      newCards = await prisma.card.findMany({
        where: { deckId, deletedAt: null, deck: { userId: user.sub }, cardState: { phase: 'new' } },
        orderBy: { createdAt: 'asc' },
        take: newLimit,
        select: cardSelect,
      });
    }
  }

  const allCards = [...inProgressCards, ...reviewCards, ...newCards].map((card) => {
    const state = materializeFsrsState({
      current: {
        interval: card.cardState!.interval,
        dueDate: card.cardState!.dueDate,
        stability: card.cardState!.stability,
        difficulty: card.cardState!.difficulty,
        scheduledDays: card.cardState!.scheduledDays,
        reps: card.cardState!.reps,
        lapses: card.cardState!.lapses,
        learningStep: card.cardState!.learningStep,
        phase: card.cardState!.phase as 'new' | 'learning' | 'review' | 'relearning',
        lastReview: card.cardState!.lastReview,
      },
      reviewLogs: card.reviewLogs,
      now,
    });

    return {
      id: card.id,
      word: card.word,
      translate: card.translate,
      phase: state.phase,
      dueDate: state.dueDate,
      intervalHints: getIntervalHints(state, now),
    };
  });

  // "Next due" = the next batch from tomorrow onward (today's cards are already available).
  const nextDueCard = await prisma.card.findFirst({
    where: { deckId, deletedAt: null, deck: { userId: user.sub }, cardState: { dueDate: { gte: endOfToday } } },
    orderBy: { cardState: { dueDate: 'asc' } },
    select: { cardState: { select: { dueDate: true } } },
  });

  return NextResponse.json({
    cards: allCards,
    remainingReviews: Math.max(0, remainingReviews - reviewCards.length - newCards.length),
    nextDueDate: nextDueCard?.cardState?.dueDate || null,
  });
}
