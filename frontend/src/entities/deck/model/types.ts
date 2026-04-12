export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  dueCount: number;
  newCount?: number;
  createdAt: string;
  updatedAt?: string;
}
