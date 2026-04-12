import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { Statistics } from '@/types';

export const statisticsKeys = {
  all: ['statistics'] as const,
  byPeriod: (period: string) => [...statisticsKeys.all, period] as const,
};

export const statisticsOptions = (period: string) =>
  queryOptions({
    queryKey: statisticsKeys.byPeriod(period),
    queryFn: () => fetchApi<Statistics>(`/api/statistics?period=${period}`),
  });
