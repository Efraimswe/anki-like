import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DailyLimitsService } from './daily-limits.service';
import {
  ReviewsRepository,
  type ReviewCardSnapshot,
} from '../domain/ports/reviews.repository';
import { Sm2Service, Rating, CardState } from '../domain/services/sm2.service';
import { RatingInput } from '../infrastructure/http/dto/submit-review.dto';
import { formatInterval } from '../domain/services/interval-format';

const RATING_MAP: Record<RatingInput, Rating> = {
  [RatingInput.AGAIN]: Rating.AGAIN,
  [RatingInput.HARD]: Rating.HARD,
  [RatingInput.GOOD]: Rating.GOOD,
  [RatingInput.EASY]: Rating.EASY,
};

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly sm2: Sm2Service,
    private readonly dailyLimits: DailyLimitsService,
  ) {}

  async getDueCards(userId: string, deckId: string, limit?: number) {
    const deck = await this.reviewsRepository.findDeckForUser(userId, deckId);
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

    const now = new Date();
    const reviewCards = await this.reviewsRepository.findDueReviewCards(
      userId,
      deckId,
      effectiveLimit,
      learningCutoff,
      now,
    );

    const newLimit = Math.min(remainingNew, effectiveLimit - reviewCards.length);
    let newCards: ReviewCardSnapshot[] = [];
    if (newLimit > 0) {
      newCards = await this.reviewsRepository.findNewCards(userId, deckId, newLimit);
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

    const nextDueCard = await this.reviewsRepository.findNextDueCard(userId, deckId, now);

    return {
      cards: allCards,
      remainingNew: remainingNew - newCards.length,
      remainingReviews: remainingReviews - allCards.length,
      nextDueDate: nextDueCard?.cardState?.dueDate || null,
    };
  }

  async submitReview(userId: string, cardId: string, ratingInput: RatingInput, timeTakenMs?: number) {
    const rating = RATING_MAP[ratingInput];
    const cardState = await this.reviewsRepository.findReviewableCardState(cardId);

    if (!cardState || cardState.card.deletedAt !== null || cardState.card.deck.userId !== userId) {
      throw new NotFoundException('Card not found');
    }

    const currentState: CardState = {
      interval: cardState.interval,
      easeFactor: cardState.easeFactor,
      repetitions: cardState.repetitions,
      phase: cardState.phase as CardState['phase'],
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

    await this.reviewsRepository.persistReview({
      userId,
      cardId,
      rating,
      timeTakenMs,
      isNewCard,
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
        learningStep: newState.learningStep,
        dueDate: newState.dueDate,
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
      intervalDisplay: formatInterval(newState.interval),
    };
  }
}
