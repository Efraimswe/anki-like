import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { Deck } from '@/types';

export const deckKeys = {
  all: ['decks'] as const,
  lists: () => [...deckKeys.all, 'list'] as const,
  detail: (id: string) => [...deckKeys.all, 'detail', id] as const,
};

export const deckListOptions = queryOptions({
  queryKey: deckKeys.lists(),
  queryFn: () => fetchApi<Deck[]>('/api/decks'),
});

export const deckDetailOptions = (id: string) =>
  queryOptions({
    queryKey: deckKeys.detail(id),
    queryFn: () => fetchApi<Deck>(`/api/decks/${id}`),
    enabled: !!id,
  });
