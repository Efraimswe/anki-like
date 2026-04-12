import { computeParameters, FSRSBindingItem, FSRSBindingReview } from '@open-spaced-repetition/binding';
import { MIN_OPTIMIZATION_CARDS, MIN_OPTIMIZATION_REVIEWS } from './fsrs-defaults';

export interface OptimizableReview {
  cardId: string;
  rating: number;
  reviewedAt: Date;
}

export interface OptimizationResult {
  ok: boolean;
  reason?: string;
  weights?: number[];
  reviewCount: number;
  cardCount: number;
}

export async function optimizeDeckFsrs(reviews: OptimizableReview[]): Promise<OptimizationResult> {
  const grouped = new Map<string, OptimizableReview[]>();
  for (const review of reviews) {
    if (!grouped.has(review.cardId)) grouped.set(review.cardId, []);
    grouped.get(review.cardId)!.push(review);
  }

  const items = Array.from(grouped.values())
    .map((cardReviews) => cardReviews.sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime()))
    .map((cardReviews) => {
      const rows = cardReviews
        .map((review, index) => {
          const rating = toBindingRating(review.rating);
          if (rating === null) return null;
          const previous = index === 0 ? review.reviewedAt : cardReviews[index - 1].reviewedAt;
          const deltaDays = index === 0
            ? 0
            : Math.max(0, Math.round((review.reviewedAt.getTime() - previous.getTime()) / 86400000));
          return new FSRSBindingReview(rating, deltaDays);
        })
        .filter((row): row is FSRSBindingReview => row !== null);

      return rows.length ? new FSRSBindingItem(rows) : null;
    })
    .filter((item): item is FSRSBindingItem => item !== null);

  const reviewCount = reviews.length;
  const cardCount = items.length;

  if (reviewCount < MIN_OPTIMIZATION_REVIEWS || cardCount < MIN_OPTIMIZATION_CARDS) {
    return {
      ok: false,
      reason: `Need at least ${MIN_OPTIMIZATION_REVIEWS} reviews across ${MIN_OPTIMIZATION_CARDS} cards before optimization.`,
      reviewCount,
      cardCount,
    };
  }

  const weights = await computeParameters(items, {
    enableShortTerm: true,
    numRelearningSteps: 1,
    timeout: 1500,
  });

  return {
    ok: true,
    weights,
    reviewCount,
    cardCount,
  };
}

function toBindingRating(rating: number): number | null {
  if (rating === 0) return 1;
  if (rating === 2) return 2;
  if (rating === 3) return 3;
  if (rating === 5) return 4;
  return null;
}
