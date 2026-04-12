export interface ReviewDeckAvailability {
  id: string;
}

export interface ReviewCardSnapshot {
  id: string;
  front: string;
  back: string;
  type: string;
  cardState: {
    phase: string;
    dueDate: Date | null;
    interval: number;
    easeFactor: number;
    repetitions: number;
    learningStep: number;
  } | null;
}

export interface NextDueSnapshot {
  cardState: {
    dueDate: Date | null;
  } | null;
}

export interface ReviewableCardState {
  interval: number;
  easeFactor: number;
  repetitions: number;
  phase: string;
  learningStep: number;
  card: {
    deletedAt: Date | null;
    deck: {
      userId: string;
    };
  };
}

export interface PersistReviewInput {
  userId: string;
  cardId: string;
  rating: number;
  timeTakenMs?: number;
  isNewCard: boolean;
  previousState: {
    interval: number;
    easeFactor: number;
    repetitions: number;
    phase: string;
  };
  newState: {
    interval: number;
    easeFactor: number;
    repetitions: number;
    learningStep: number;
    dueDate: Date;
    phase: string;
  };
}

export abstract class ReviewsRepository {
  abstract findDeckForUser(userId: string, deckId: string): Promise<ReviewDeckAvailability | null>;
  abstract findDueReviewCards(
    userId: string,
    deckId: string,
    effectiveLimit: number,
    learningCutoff: Date,
    now: Date,
  ): Promise<ReviewCardSnapshot[]>;
  abstract findNewCards(userId: string, deckId: string, limit: number): Promise<ReviewCardSnapshot[]>;
  abstract findNextDueCard(userId: string, deckId: string, now: Date): Promise<NextDueSnapshot | null>;
  abstract findReviewableCardState(cardId: string): Promise<ReviewableCardState | null>;
  abstract persistReview(input: PersistReviewInput): Promise<void>;
}
