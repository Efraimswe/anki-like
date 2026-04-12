import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { Card } from '@/types';

export const cardKeys = {
  all: ['cards'] as const,
  list: (deckId: string) => [...cardKeys.all, 'list', deckId] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};

export const cardListOptions = (deckId: string) =>
  queryOptions({
    queryKey: cardKeys.list(deckId),
    queryFn: () => fetchApi<Card[]>(`/api/cards?deckId=${deckId}`),
    enabled: !!deckId,
  });
