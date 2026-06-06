import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { DueCardsResponse } from '@/types';

const reviewAll = ['reviews'] as const;

export const reviewKeys = {
  all: reviewAll,
  session: (deckId: string) => [...reviewAll, 'session', deckId] as const,
};

export const reviewSessionOptions = (deckId: string) =>
  queryOptions({
    queryKey: reviewKeys.session(deckId),
    queryFn: () => fetchApi<DueCardsResponse>(`/api/reviews/session/${deckId}`),
    enabled: !!deckId,
    staleTime: 0,
  });
