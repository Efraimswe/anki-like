import { NextRequest, NextResponse } from 'next/server';
import { Rating, type Grade } from 'ts-fsrs';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { scheduleReview, toStoredRating } from '@/lib/fsrs';
import { materializeFsrsState } from '@/lib/fsrs-migration';
import { formatInterval } from '@/lib/interval-format';
import { getNow } from '@/lib/clock';
import { dayKey } from '@/lib/daily';
import { submitReviewSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

const RATING_MAP: Record<string, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message || 'Invalid input');

  const { cardId, rating: ratingInput, timeTakenMs } = parsed.data;
  const rating = RATING_MAP[ratingInput];

  const cardState = await prisma.cardState.findUnique({
    where: { cardId },
    include: {
      card: {
        select: {
          deletedAt: true,
          deckId: true,
          deck: { select: { userId: true, dailyReviewLimit: true } },
        },
      },
    },
  });

  if (!cardState || cardState.card.deletedAt !== null || cardState.card.deck.userId !== user.sub) {
    return jsonError(404, 'Card not found');
  }

  const deckId = cardState.card.deckId;
  const now = getNow();
  const today = dayKey(now);

  const counter = await prisma.deckDailyCounter.findUnique({
    where: { deckId_date: { deckId, date: today } },
    select: { reviewCount: true },
  });
  if ((counter?.reviewCount ?? 0) >= cardState.card.deck.dailyReviewLimit) {
    return jsonError(429, 'Daily review limit reached for this deck');
  }

  const reviewLogs = await prisma.reviewLog.findMany({
    where: { cardId },
    orderBy: { reviewedAt: 'asc' },
    select: { rating: true, reviewedAt: true },
  });

  const currentState = materializeFsrsState({
    current: {
      interval: cardState.interval,
      dueDate: cardState.dueDate,
      stability: cardState.stability,
      difficulty: cardState.difficulty,
      scheduledDays: cardState.scheduledDays,
      reps: cardState.reps,
      lapses: cardState.lapses,
      learningStep: cardState.learningStep,
      phase: cardState.phase as 'new' | 'learning' | 'review' | 'relearning',
      lastReview: cardState.lastReview,
    },
    reviewLogs,
    now,
  });

  const newState = scheduleReview(currentState, rating, now);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.cardState.update({
      where: { cardId },
      data: {
        interval: newState.intervalMinutes,
        learningStep: newState.learningStep,
        dueDate: newState.dueDate,
        phase: newState.phase,
        stability: newState.stability,
        difficulty: newState.difficulty,
        scheduledDays: newState.scheduledDays,
        reps: newState.reps,
        lapses: newState.lapses,
        lastReview: now,
        updatedAt: now,
      },
    });

    await tx.reviewLog.create({
      data: {
        cardId,
        rating: toStoredRating(rating),
        intervalBefore: currentState.interval,
        intervalAfter: newState.intervalMinutes,
        easeBefore: currentState.difficulty,
        easeAfter: newState.difficulty,
        timeTakenMs: timeTakenMs || null,
      },
    });

    await tx.deckDailyCounter.upsert({
      where: { deckId_date: { deckId, date: today } },
      create: { deckId, date: today, reviewCount: 1 },
      update: { reviewCount: { increment: 1 } },
    });
  });

  return NextResponse.json({
    cardId,
    previousState: {
      phase: currentState.phase,
      interval: currentState.interval,
      stability: currentState.stability,
      difficulty: currentState.difficulty,
    },
    newState: {
      phase: newState.phase,
      interval: newState.intervalMinutes,
      stability: newState.stability,
      difficulty: newState.difficulty,
      dueDate: newState.dueDate,
    },
    intervalDisplay: formatInterval(newState.intervalMinutes),
  });
}
