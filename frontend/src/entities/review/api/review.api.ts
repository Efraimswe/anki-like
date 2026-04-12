import { api } from '@/shared/api/base';
import type { DueCardsResponse, Rating, ReviewResult } from '../model/types';

export function getDueCards(deckId: string): Promise<DueCardsResponse> {
  return api.get(`/decks/${deckId}/reviews/due`);
}

export function submitReview(cardId: string, rating: Rating, timeTakenMs: number): Promise<ReviewResult> {
  return api.post('/reviews', { cardId, rating, timeTakenMs });
}
