/**
 * "To review today" rule — the single source of truth shared by the deck list
 * and deck detail counts. A card is due to review once it has left the `new`
 * phase and its due date has arrived or passed (overdue cards are included, so a
 * card whose due day was skipped still counts).
 */

export interface DueCardState {
  phase: string;
  dueDate: Date;
}

export function isDueForReview(state: DueCardState | null | undefined, now: Date): boolean {
  if (!state) return false;
  if (state.phase === 'new') return false;
  return new Date(state.dueDate).getTime() <= now.getTime();
}

export function countDueForReview(states: Array<DueCardState | null | undefined>, now: Date): number {
  return states.reduce((count, state) => (isDueForReview(state, now) ? count + 1 : count), 0);
}
