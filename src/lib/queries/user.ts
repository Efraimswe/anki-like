import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { User } from '@/types';

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export const currentUserOptions = queryOptions({
  queryKey: userKeys.me(),
  queryFn: () => fetchApi<User>('/api/users/me'),
});
