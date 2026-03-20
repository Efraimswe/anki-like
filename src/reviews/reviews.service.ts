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

  async getDueCards(deckId: string, limit?: number) {
    // Verify deck exists
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, deletedAt: null },
    });
    if (!deck) throw new NotFoundException('Deck not found');

    // Get limits and counters
    const limits = await this.dailyLimits.getLimits();
    const counters = await this.dailyLimits.getCounters();

    const remainingNew = Math.max(0, limits.maxNewCards - counters.todayNewCount);
    const remainingReviews = Math.max(0, limits.maxReviews - counters.todayReviewCount);

    if (remainingReviews === 0) {
      return {
        cards: [],
        remainingNew: 0,
        remainingReviews: 0,
        nextDueDate: null,
      };
    }

    const effectiveLimit = Math.min(limit || 50, remainingReviews);

    // Get due review/relearning/learning cards
    const reviewCards = await this.prisma.card.findMany({
      where: {
        deckId,
        deletedAt: null,
        cardState: {
          dueDate: { lte: new Date() },
          phase: { not: 'new' },
        },
      },
      orderBy: { cardState: { dueDate: 'asc' } },
      take: effectiveLimit,
      select: {
        id: true,
        front: true,
        back: true,
        type: true,
        cardState: { select: { phase: true, dueDate: true } },
      },
    });

    // Get new cards up to remaining new limit
    const newLimit = Math.min(remainingNew, effectiveLimit - reviewCards.length);
    let newCards: any[] = [];
    if (newLimit > 0) {
      newCards = await this.prisma.card.findMany({
        where: {
          deckId,
          deletedAt: null,
          cardState: { phase: 'new' },
        },
        orderBy: { createdAt: 'asc' },
        take: newLimit,
        select: {
          id: true,
          front: true,
          back: true,
          type: true,
          cardState: { select: { phase: true, dueDate: true } },
        },
      });
    }

    const allCards = [...reviewCards, ...newCards].map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type,
      phase: c.cardState?.phase,
      dueDate: c.cardState?.dueDate,
    }));

    // Get next due date
    const nextDueCard = await this.prisma.card.findFirst({
      where: {
        deckId,
        deletedAt: null,
        cardState: { dueDate: { gt: new Date() } },
      },
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

  async submitReview(
    cardId: string,
    ratingInput: RatingInput,
    timeTakenMs?: number,
  ) {
    const rating = RATING_MAP[ratingInput];

    return this.prisma.$transaction(async (tx) => {
      // Read current state
      const cardState = await tx.cardState.findUnique({
        where: { cardId },
        include: { card: { select: { deletedAt: true } } },
      });

      if (!cardState || cardState.card.deletedAt !== null) {
        throw new NotFoundException('Card not found');
      }

      const currentState: CardState = {
        interval: cardState.interval,
        easeFactor: cardState.easeFactor,
        repetitions: cardState.repetitions,
        phase: cardState.phase as CardState['phase'],
      };

      // Check daily limits
      const isNewCard = currentState.phase === 'new';
      const limitCheck = await this.dailyLimits.checkLimits(isNewCard);
      if (!limitCheck.allowed) {
        throw new HttpException(
          { statusCode: 429, message: limitCheck.reason },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Compute new state
      const newState = this.sm2.calculate(currentState, rating);

      // Update card_states
      await tx.cardState.update({
        where: { cardId },
        data: {
          interval: newState.interval,
          easeFactor: newState.easeFactor,
          repetitions: newState.repetitions,
          dueDate: newState.dueDate,
          phase: newState.phase,
          updatedAt: new Date(),
        },
      });

      // Insert review log
      await tx.reviewLog.create({
        data: {
          cardId,
          rating,
          intervalBefore: currentState.interval,
          intervalAfter: newState.interval,
          easeBefore: currentState.easeFactor,
          easeAfter: newState.easeFactor,
          timeTakenMs: timeTakenMs || null,
        },
      });

      // Increment daily counter
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      await tx.dailyCounter.upsert({
        where: { date: today },
        create: {
          date: today,
          newCount: isNewCard ? 1 : 0,
          reviewCount: 1,
        },
        update: {
          newCount: { increment: isNewCard ? 1 : 0 },
          reviewCount: { increment: 1 },
        },
      });

      return {
        cardId,
        previousState: {
          phase: currentState.phase,
          interval: currentState.interval,
          easeFactor: currentState.easeFactor,
          repetitions: currentState.repetitions,
        },
        newState: {
          phase: newState.phase,
          interval: newState.interval,
          easeFactor: newState.easeFactor,
          repetitions: newState.repetitions,
          dueDate: newState.dueDate,
        },
      };
    });
  }
}
