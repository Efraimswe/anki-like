import { queryOptions, infiniteQueryOptions, keepPreviousData } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { Deck } from '@/types';

export interface DeckPage {
  items: Deck[];
  nextCursor: string | null;
}

export const deckKeys = {
  all: ['decks'] as const,
  lists: () => [...deckKeys.all, 'list'] as const,
  detail: (id: string) => [...deckKeys.all, 'detail', id] as const,
};

export const deckListInfiniteOptions = infiniteQueryOptions({
  queryKey: deckKeys.lists(),
  queryFn: ({ pageParam }) =>
    fetchApi<DeckPage>(`/api/decks${pageParam ? `?cursor=${pageParam}` : ''}`),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const deckDetailOptions = (id: string) =>
  queryOptions({
    queryKey: deckKeys.detail(id),
    queryFn: () => fetchApi<Deck & { cards: import('@/types').Card[] }>(`/api/decks/${id}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
