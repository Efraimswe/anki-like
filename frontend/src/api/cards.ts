import { api } from './client';
import type { Card } from './types';

export async function getCards(deckId: string): Promise<Card[]> {
  const res = await api.get<{ data: Card[] }>(`/decks/${deckId}/cards`);
  return res.data;
}

export function createCard(deckId: string, data: { front: string; back: string; type: string }): Promise<Card> {
  return api.post(`/decks/${deckId}/cards`, data);
}

export function updateCard(id: string, data: Partial<{ front: string; back: string; tags: string[] }>): Promise<Card> {
  return api.patch(`/cards/${id}`, data);
}

export function deleteCard(id: string): Promise<void> {
  return api.delete(`/cards/${id}`);
}
