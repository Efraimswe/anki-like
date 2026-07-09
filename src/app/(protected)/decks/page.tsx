'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { deckListInfiniteOptions } from '@/lib/queries/decks';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Single-deck app: no deck list. Redirect straight into the one deck.
export default function DeckListPage() {
  const router = useRouter();

  const { data, isPending, isError, error } = useInfiniteQuery(deckListInfiniteOptions);
  const decks = data?.pages.flatMap((p) => p.items) ?? [];
  const firstDeckId = decks[0]?.id;

  useEffect(() => {
    if (firstDeckId) router.replace(`/decks/${firstDeckId}`);
  }, [firstDeckId, router]);

  if (isError) {
    return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load your vocabulary'} />;
  }

  // No deck at all — should not happen once the single deck exists, but never
  // leave the user on a silent infinite spinner with no way forward.
  if (!isPending && decks.length === 0) {
    return <ErrorMessage message="No vocabulary found" />;
  }

  // Loading, or loaded and redirecting: keep visible feedback until we arrive.
  return <LoadingSpinner />;
}
