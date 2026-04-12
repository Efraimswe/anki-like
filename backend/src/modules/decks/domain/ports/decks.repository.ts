export interface DeckCardSnapshot {
  id: string;
  cardState: {
    dueDate: Date | null;
    phase?: string;
  } | null;
}

export interface DeckSnapshot {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  cards: DeckCardSnapshot[];
}

export abstract class DecksRepository {
  abstract create(userId: string, name: string): Promise<{ id: string; name: string; createdAt: Date }>;
  abstract findAllByUser(userId: string): Promise<DeckSnapshot[]>;
  abstract findOneByUser(userId: string, id: string): Promise<DeckSnapshot | null>;
  abstract existsForUser(userId: string, id: string): Promise<boolean>;
  abstract update(id: string, data: { name?: string; updatedAt: Date }): Promise<{ id: string; name: string; createdAt: Date; updatedAt: Date }>;
  abstract softDeleteWithCards(userId: string, id: string, now: Date): Promise<number>;
}
