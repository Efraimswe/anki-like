import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/api-utils';
import { checkLimits } from '@/lib/daily-limits';
import { calculate, Rating, type CardState } from '@/lib/sm2';
import { formatInterval } from '@/lib/interval-format';
import { submitReviewSchema } from '@/lib/validations';
import type { TokenPayload } from '@/lib/auth';

const RATING_MAP: Record<string, Rating> = {
  again: Rating.AGAIN,
  hard: Rating.HARD,
  good: Rating.GOOD,
  easy: Rating.EASY,
};

function startOfUtcDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

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
    include: { card: { select: { deletedAt: true, deck: { select: { userId: true } } } } },
  });

  if (!cardState || cardState.card.deletedAt !== null || cardState.card.deck.userId !== user.sub) {
    return jsonError(404, 'Card not found');
  }

  const currentState: CardState = {
    interval: cardState.interval,
    easeFactor: cardState.easeFactor,
    repetitions: cardState.repetitions,
    phase: cardState.phase as CardState['phase'],
    learningStep: cardState.learningStep,
  };

  const isNewCard = currentState.phase === 'new';
  const limitCheck = await checkLimits(user.sub, isNewCard);
  if (!limitCheck.allowed) {
    return jsonError(429, limitCheck.reason!);
  }

  const newState = calculate(currentState, rating);

  await prisma.$transaction(async (tx) => {
    await tx.cardState.update({
      where: { cardId },
      data: {
        interval: newState.interval,
        easeFactor: newState.easeFactor,
        repetitions: newState.repetitions,
        learningStep: newState.learningStep,
        dueDate: newState.dueDate,
        phase: newState.phase,
        updatedAt: new Date(),
      },
    });

    await tx.reviewLog.create({
      data: {
        cardId,
        rating: rating as number,
        intervalBefore: currentState.interval,
        intervalAfter: newState.interval,
        easeBefore: currentState.easeFactor,
        easeAfter: newState.easeFactor,
        timeTakenMs: timeTakenMs || null,
      },
    });

    await tx.dailyCounter.upsert({
      where: { userId_date: { userId: user.sub, date: startOfUtcDay(new Date()) } },
      create: { userId: user.sub, date: startOfUtcDay(new Date()), newCount: isNewCard ? 1 : 0, reviewCount: 1 },
      update: { newCount: { increment: isNewCard ? 1 : 0 }, reviewCount: { increment: 1 } },
    });
  });

  return NextResponse.json({
    cardId,
    previousState: { phase: currentState.phase, interval: currentState.interval, easeFactor: currentState.easeFactor, repetitions: currentState.repetitions },
    newState: { phase: newState.phase, interval: newState.interval, easeFactor: newState.easeFactor, repetitions: newState.repetitions, dueDate: newState.dueDate },
    intervalDisplay: formatInterval(newState.interval),
  });
}
