import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Sm2Service, Rating, CardState } from './sm2.service';
import { DailyLimitsService } from './daily-limits.service';
import { RatingInput } from './dto/submit-review.dto';
import { formatInterval } from './interval-format';

const RATING_MAP: Record<RatingInput, Rating> = {
  [RatingInput.AGAIN]: Rating.AGAIN,
  [RatingInput.HARD]: Rating.HARD,
  [RatingInput.GOOD]: Rating.GOOD,
  [RatingInput.EASY]: Rating.EASY,
};

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sm2: Sm2Service,
    private readonly dailyLimits: DailyLimitsService,
  ) {}

  async getDueCards(userId: string, deckId: string, limit?: number) {
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, userId, deletedAt: null },
    });
    if (!deck) throw new NotFoundException('Deck not found');

    const limits = await this.dailyLimits.getLimits(userId);
    const counters = await this.dailyLimits.getCounters(userId);

    const remainingNew = Math.max(0, limits.maxNewCards - counters.todayNewCount);
    const remainingReviews = Math.max(0, limits.maxReviews - counters.todayReviewCount);

    if (remainingReviews === 0) {
      return { cards: [], remainingNew: 0, remainingReviews: 0, nextDueDate: null };
    }

    const effectiveLimit = Math.min(limit || 50, remainingReviews);
    const learningCutoff = new Date(Date.now() + 20 * 60 * 1000);

    const reviewCards = await this.prisma.card.findMany({
      where: {
        deckId,
        deletedAt: null,
        deck: { userId },
        cardState: {
          phase: { not: 'new' },
          OR: [
            { dueDate: { lte: new Date() } },
            { phase: { in: ['learning', 'relearning'] }, dueDate: { lte: learningCutoff } },
          ],
        },
      },
      orderBy: { cardState: { dueDate: 'asc' } },
      take: effectiveLimit,
      select: {
        id: true, front: true, back: true, type: true,
        cardState: {
          select: { phase: true, dueDate: true, interval: true, easeFactor: true, repetitions: true, learningStep: true },
        },
      },
    });

    const newLimit = Math.min(remainingNew, effectiveLimit - reviewCards.length);
    let newCards: typeof reviewCards = [];
    if (newLimit > 0) {
      newCards = await this.prisma.card.findMany({
        where: { deckId, deletedAt: null, deck: { userId }, cardState: { phase: 'new' } },
        orderBy: { createdAt: 'asc' },
        take: newLimit,
        select: {
          id: true, front: true, back: true, type: true,
          cardState: {
            select: { phase: true, dueDate: true, interval: true, easeFactor: true, repetitions: true, learningStep: true },
          },
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
        intervalHints: this.sm2.previewIntervals(state),
      };
    });

    const nextDueCard = await this.prisma.card.findFirst({
      where: { deckId, deletedAt: null, deck: { userId }, cardState: { dueDate: { gt: new Date() } } },
      orderBy: { cardState: { dueDate: 'asc' } },
      select: { cardState: { select: { dueDate: true } } },
    });

    return {
      cards: allCards,
      remainingNew: remainingNew - newCards.length,
      remainingReviews: remainingReviews - allCards.length,
      nextDueDate: nextDueCard?.cardState?.dueDate || null,
    };
  }

  async submitReview(userId: string, cardId: string, ratingInput: RatingInput, timeTakenMs?: number) {
    const rating = RATING_MAP[ratingInput];

    return this.prisma.$transaction(async (tx) => {
      const cardState = await tx.cardState.findUnique({
        where: { cardId },
        include: { card: { select: { deletedAt: true, deck: { select: { userId: true } } } } },
      });

      if (!cardState || cardState.card.deletedAt !== null || cardState.card.deck.userId !== userId) {
        throw new NotFoundException('Card not found');
      }

      const currentState: CardState = {
        interval: cardState.interval, easeFactor: cardState.easeFactor,
        repetitions: cardState.repetitions, phase: cardState.phase as CardState['phase'],
        learningStep: cardState.learningStep,
      };

      const isNewCard = currentState.phase === 'new';
      const limitCheck = await this.dailyLimits.checkLimits(userId, isNewCard);
      if (!limitCheck.allowed) {
        throw new HttpException(
          { statusCode: 429, message: limitCheck.reason },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const newState = this.sm2.calculate(currentState, rating);

      await tx.cardState.update({
        where: { cardId },
        data: {
          interval: newState.interval, easeFactor: newState.easeFactor,
          repetitions: newState.repetitions, learningStep: newState.learningStep,
          dueDate: newState.dueDate, phase: newState.phase, updatedAt: new Date(),
        },
      });

      await tx.reviewLog.create({
        data: {
          cardId, rating,
          intervalBefore: currentState.interval, intervalAfter: newState.interval,
          easeBefore: currentState.easeFactor, easeAfter: newState.easeFactor,
          timeTakenMs: timeTakenMs || null,
        },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      await tx.dailyCounter.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, newCount: isNewCard ? 1 : 0, reviewCount: 1 },
        update: { newCount: { increment: isNewCard ? 1 : 0 }, reviewCount: { increment: 1 } },
      });

      return {
        cardId,
        previousState: {
          phase: currentState.phase, interval: currentState.interval,
          easeFactor: currentState.easeFactor, repetitions: currentState.repetitions,
        },
        newState: {
          phase: newState.phase, interval: newState.interval,
          easeFactor: newState.easeFactor, repetitions: newState.repetitions, dueDate: newState.dueDate,
        },
        intervalDisplay: formatInterval(newState.interval),
      };
    });
  }
}
