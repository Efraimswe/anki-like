export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: 'basic' | 'reverse' | 'cloze';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}
