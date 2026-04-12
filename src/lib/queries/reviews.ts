import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { DueCardsResponse, DailyLimits } from '@/types';

const reviewAll = ['reviews'] as const;

export const reviewKeys = {
  all: reviewAll,
  session: (deckId: string) => [...reviewAll, 'session', deckId] as const,
  dailyLimits: [...reviewAll, 'daily-limits'] as const,
};

export const reviewSessionOptions = (deckId: string) =>
  queryOptions({
    queryKey: reviewKeys.session(deckId),
    queryFn: () => fetchApi<DueCardsResponse>(`/api/reviews/session/${deckId}`),
    enabled: !!deckId,
    staleTime: 0,
  });

export const dailyLimitsOptions = queryOptions({
  queryKey: reviewKeys.dailyLimits,
  queryFn: () => fetchApi<DailyLimits>('/api/reviews/daily-limits'),
});
