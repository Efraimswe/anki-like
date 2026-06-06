export const cardKeys = {
  all: ['cards'] as const,
  list: (deckId: string) => [...cardKeys.all, 'list', deckId] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};
