import type { DeckFsrsConfigLike } from './fsrs-defaults';
import { createNewStoredState, restoreStateFromHistory, toFsrsHistory, type StoredFsrsState } from './fsrs';

export interface LegacyCardStateInput {
  interval: number;
  dueDate: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningStep: number;
  phase: 'new' | 'learning' | 'review' | 'relearning';
  lastReview: Date | null;
}

export function materializeFsrsState(params: {
  current: LegacyCardStateInput;
  reviewLogs: Array<{ rating: number; reviewedAt: Date }>;
  now: Date;
  config?: Partial<DeckFsrsConfigLike> | null;
}): StoredFsrsState {
  const { current, reviewLogs, now, config } = params;

  if (current.stability > 0 && current.difficulty > 0) {
    return current;
  }

  if (reviewLogs.length > 0) {
    return restoreStateFromHistory(now, toFsrsHistory(reviewLogs), config);
  }

  return createNewStoredState(now);
}
