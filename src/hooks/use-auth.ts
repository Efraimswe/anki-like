'use client';

import { useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';
import { fetchApi } from '@/lib/auth-client';

export { fetchApi };

interface UseAuthValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

export function useAuth(): UseAuthValue {
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<User>({
    queryKey: ['user'],
    queryFn: () => fetchApi<User>('/api/users/me'),
    enabled: isLoaded && isSignedIn === true,
    staleTime: 60_000,
  });

  const signOut = useCallback(async () => {
    await clerk.signOut({ redirectUrl: '/sign-in' });
  }, [clerk]);

  const updateUser = useCallback(
    (u: User) => queryClient.setQueryData(['user'], u),
    [queryClient],
  );

  return {
    user: isSignedIn ? (data ?? null) : null,
    loading: !isLoaded || (isSignedIn === true && isLoading),
    signOut,
    updateUser,
  };
}
