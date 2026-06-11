import { endOfDay } from './daily';

/**
 * "To review today" rule — the single source of truth shared by the deck list
 * and deck detail counts. A card has left the `new` phase and:
 *  - review cards count with day granularity: due any time today (local) or
 *    earlier, so they become available from local midnight (Anki-style);
 *  - learning / relearning cards keep minute precision, so sub-day steps
 *    (1m, 10m, …) still wait their exact turn within the day.
 * Overdue cards (a skipped due day) are included in both cases.
 */

export interface DueCardState {
  phase: string;
  dueDate: Date;
}

export function isDueForReview(state: DueCardState | null | undefined, now: Date): boolean {
  if (!state) return false;
  if (state.phase === 'new') return false;
  const due = new Date(state.dueDate).getTime();
  if (state.phase === 'review') return due < endOfDay(now).getTime();
  return due <= now.getTime();
}

export function countDueForReview(states: Array<DueCardState | null | undefined>, now: Date): number {
  return states.reduce((count, state) => (isDueForReview(state, now) ? count + 1 : count), 0);
}
