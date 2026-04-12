import {
  createEmptyCard,
  fsrs,
  formatDate,
  Rating,
  State,
  type Card as FsrsCard,
  type CardInput as FsrsCardInput,
  type FSRSHistory,
  type Grade,
} from 'ts-fsrs';
import { buildFsrsParameters, type DeckFsrsConfigLike } from './fsrs-defaults';
import { formatInterval } from './interval-format';

export type ReviewPhase = 'new' | 'learning' | 'review' | 'relearning';

export interface StoredFsrsState {
  interval: number;
  dueDate: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningStep: number;
  phase: ReviewPhase;
  lastReview: Date | null;
}

export interface ReviewPreview extends StoredFsrsState {
  intervalMinutes: number;
}

export interface IntervalHints {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export function createScheduler(config?: Partial<DeckFsrsConfigLike> | null) {
  return fsrs(buildFsrsParameters(config));
}

export function getIntervalHints(
  state: StoredFsrsState,
  now: Date,
  config?: Partial<DeckFsrsConfigLike> | null,
): IntervalHints {
  const scheduler = createScheduler(config);
  const card = toFsrsCard(state);
  const preview = scheduler.repeat(card, now);

  return {
    again: formatInterval(minutesUntil(preview[Rating.Again].card.due, now)),
    hard: formatInterval(minutesUntil(preview[Rating.Hard].card.due, now)),
    good: formatInterval(minutesUntil(preview[Rating.Good].card.due, now)),
    easy: formatInterval(minutesUntil(preview[Rating.Easy].card.due, now)),
  };
}

export function scheduleReview(
  state: StoredFsrsState,
  rating: Grade,
  now: Date,
  config?: Partial<DeckFsrsConfigLike> | null,
): ReviewPreview {
  const scheduler = createScheduler(config);
  const next = scheduler.next(toFsrsCard(state), now, rating).card;
  return fromFsrsCard(next, now);
}

export function createNewStoredState(now: Date): StoredFsrsState {
  return fromFsrsCard(createEmptyCard(now), now);
}

export function restoreStateFromHistory(
  now: Date,
  history: FSRSHistory[],
  config?: Partial<DeckFsrsConfigLike> | null,
): StoredFsrsState {
  const scheduler = createScheduler(config);
  const initialCard = createEmptyCard(history[0]?.review ?? now);
  const restoredItem = scheduler.reschedule(initialCard, history, {
    now,
    update_memory_state: true,
  }).reschedule_item;
  const restored = restoredItem ? restoredItem.card : createEmptyCard(now);

  return fromFsrsCard(restored, now);
}

export function toFsrsHistory(
  reviews: Array<{ rating: number; reviewedAt: Date }>,
): FSRSHistory[] {
  const history: FSRSHistory[] = [];
  for (const review of reviews) {
    const rating = toFsrsRating(review.rating);
    if (rating === null) continue;
    history.push({
      rating,
      review: review.reviewedAt,
    });
  }

  return history.sort((a, b) => new Date(formatDate(a.review)).getTime() - new Date(formatDate(b.review)).getTime());
}

export function toFsrsRating(rating: number): Grade | null {
  if (rating === 0) return Rating.Again;
  if (rating === 2) return Rating.Hard;
  if (rating === 3) return Rating.Good;
  if (rating === 5) return Rating.Easy;
  return null;
}

export function toStoredRating(rating: Grade): 0 | 2 | 3 | 5 {
  if (rating === Rating.Again) return 0;
  if (rating === Rating.Hard) return 2;
  if (rating === Rating.Good) return 3;
  return 5;
}

export function toFsrsCard(state: StoredFsrsState): FsrsCardInput {
  return {
    due: state.dueDate,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0,
    scheduled_days: state.scheduledDays,
    reps: state.reps,
    lapses: state.lapses,
    learning_steps: state.learningStep,
    state: toFsrsState(state.phase),
    last_review: state.lastReview,
  };
}

export function fromFsrsCard(card: FsrsCard, now: Date): ReviewPreview {
  return {
    phase: fromFsrsState(card.state),
    dueDate: card.due,
    interval: minutesUntil(card.due, now),
    intervalMinutes: minutesUntil(card.due, now),
    scheduledDays: card.scheduled_days,
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    learningStep: card.learning_steps,
    lastReview: card.last_review ?? null,
  };
}

function toFsrsState(phase: ReviewPhase): State {
  if (phase === 'learning') return State.Learning;
  if (phase === 'review') return State.Review;
  if (phase === 'relearning') return State.Relearning;
  return State.New;
}

function fromFsrsState(state: State): ReviewPhase {
  if (state === State.Learning) return 'learning';
  if (state === State.Review) return 'review';
  if (state === State.Relearning) return 'relearning';
  return 'new';
}

export function minutesUntil(dueDate: Date, now: Date) {
  return Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / 60000));
}
