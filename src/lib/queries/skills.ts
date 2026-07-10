import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { SkillsResponse } from '@/types';

export const skillKeys = { all: ['skills'] as const };

export const skillsOptions = queryOptions({
  queryKey: skillKeys.all,
  queryFn: () => fetchApi<SkillsResponse>('/api/skills'),
});
