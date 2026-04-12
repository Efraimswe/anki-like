import { api } from '@/shared/api/base';
import type { Deck } from '../model/types';

export function getDecks(): Promise<Deck[]> {
  return api.get('/decks');
}

export function getDeck(id: string): Promise<Deck> {
  return api.get(`/decks/${id}`);
}

export function createDeck(name: string): Promise<Deck> {
  return api.post('/decks', { name });
}

export function updateDeck(id: string, name: string): Promise<Deck> {
  return api.patch(`/decks/${id}`, { name });
}

export function deleteDeck(id: string): Promise<void> {
  return api.delete(`/decks/${id}`);
}
