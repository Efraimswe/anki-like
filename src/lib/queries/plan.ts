import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { PlanGoalsResponse } from '@/types';

export const planKeys = { all: ['plan-goals'] as const };

export const planGoalsOptions = queryOptions({
  queryKey: planKeys.all,
  queryFn: () => fetchApi<PlanGoalsResponse>('/api/plan/goals'),
});
