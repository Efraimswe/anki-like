export interface CardListItem {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: string;
  tags: string[];
  createdAt: Date;
}

export interface CardWithDeck extends CardListItem {
  deck: {
    id: string;
    name: string;
  };
}

export interface CardDetails extends CardListItem {
  updatedAt: Date;
  cardState: {
    phase: string;
    interval: number;
    easeFactor: number;
    repetitions: number;
    dueDate: Date | null;
  } | null;
}

export abstract class CardsRepository {
  abstract createBasicCardWithState(data: {
    deckId: string;
    front: string;
    back: string;
    type: string;
    tags: string[];
  }): Promise<CardListItem>;
  abstract createReverseCardsWithState(data: {
    deckId: string;
    front: string;
    back: string;
    tags: string[];
  }): Promise<CardListItem[]>;
  abstract findByDeck(
    userId: string,
    deckId: string,
    options: { tag?: string; page: number; limit: number },
  ): Promise<{ data: CardListItem[]; total: number }>;
  abstract findAllForUser(userId: string): Promise<CardWithDeck[]>;
  abstract findByTag(userId: string, tag: string): Promise<CardListItem[]>;
  abstract findOne(userId: string, id: string): Promise<CardDetails | null>;
  abstract existsForUser(userId: string, id: string): Promise<boolean>;
  abstract update(id: string, data: {
    front?: string;
    back?: string;
    tags?: string[];
    updatedAt: Date;
  }): Promise<CardListItem & { updatedAt: Date }>;
  abstract softDelete(id: string, deletedAt: Date): Promise<void>;
}
