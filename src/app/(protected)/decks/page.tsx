'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Star, GraduationCap, Sparkles, Brain, Plus } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { deckKeys, deckListInfiniteOptions, type DeckPage } from '@/lib/queries/decks';
import CreateDeckDialog from '@/components/ui/CreateDeckDialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Owl from '@/components/ui/Owl';
import { useToast } from '@/components/ui/Toast';
import type { Deck } from '@/types';

type DeckData = InfiniteData<DeckPage>;

const VARIANTS = ['green', 'blue', 'orange', 'purple', 'gold'] as const;
const RING_COLOR: Record<(typeof VARIANTS)[number], string> = {
  green: 'var(--duo-green-shadow)',
  blue: 'var(--duo-blue-shadow)',
  orange: 'var(--duo-orange-shadow)',
  purple: 'var(--duo-purple-shadow)',
  gold: 'var(--duo-gold-shadow)',
};
const NODE_ICONS = [BookOpen, Star, GraduationCap, Sparkles, Brain];
const OFFSETS = [0, 46, 72, 46, 0, -46, -72, -46];

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 45;
  const c = 2 * Math.PI * r;
  return (
    <svg className="duo-node-ring" width={96} height={96} viewBox="0 0 96 96" aria-hidden>
      <circle
        cx={48}
        cy={48}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

export default function DeckListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(deckListInfiniteOptions);

  const decks = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const createDeck = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Deck>('/api/decks', { method: 'POST', body: JSON.stringify({ name }) }),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.lists() });
      const previous = queryClient.getQueryData<DeckData>(deckKeys.lists());
      const optimistic: Deck = {
        id: 'temp-' + Date.now(),
        name,
        dailyReviewLimit: 20,
        dailyAddLimit: 20,
        cardCount: 0,
        dueCount: 0,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<DeckData>(deckKeys.lists(), (old) =>
        old ? { ...old, pages: old.pages.map((p, i) => (i === 0 ? { ...p, items: [optimistic, ...p.items] } : p)) } : old,
      );
      toast({ type: 'success', title: 'Deck created', description: `"${name}" is ready for cards.` });
      return { previous };
    },
    onError: (err, _name, ctx) => {
      queryClient.setQueryData(deckKeys.lists(), ctx?.previous);
      toast({ type: 'error', title: 'Could not create deck', description: err instanceof Error ? err.message : 'Please try again.' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: deckKeys.lists() }),
  });

  const handleCreate = (name: string) => {
    setShowCreate(false);
    createDeck.mutate(name);
  };

  if (isError) {
    return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load decks'} />;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Mascot header */}
      <header className="mb-10 flex flex-col items-center text-center">
        <Owl size={96} className="owl-bob" />
        <h1 className="font-display mt-4 text-3xl font-extrabold md:text-4xl">Your learning path</h1>
        <p className="mt-2 max-w-sm text-[15px] font-bold" style={{ color: 'var(--ink-muted)' }}>
          {decks.length > 0
            ? `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'} on the trail. Tap one to review.`
            : 'Plant your first deck and start the trail.'}
        </p>
      </header>

      {isPending ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col items-center gap-8 pb-4">
          {decks.map((deck, index) => {
            const variant = VARIANTS[index % VARIANTS.length];
            const Icon = NODE_ICONS[index % NODE_ICONS.length];
            const offset = OFFSETS[index % OFFSETS.length];
            const mastery = deck.cardCount > 0 ? (deck.cardCount - deck.dueCount) / deck.cardCount : 0;
            return (
              <div key={deck.id} className={`duo-node duo-node--${variant}`} style={{ transform: `translateX(${offset}px)` }}>
                <div className="duo-node-circle">
                  <Ring pct={mastery} color={RING_COLOR[variant]} />
                  <button
                    type="button"
                    className="duo-node-btn"
                    aria-label={`Open deck ${deck.name}`}
                    onClick={() => router.push(`/decks/${deck.id}`)}
                  >
                    <Icon className="h-9 w-9" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="duo-node-label">{deck.name}</div>
                <div className="duo-node-sub">
                  {deck.cardCount === 0 ? 'Empty' : deck.dueCount > 0 ? `${deck.dueCount} due` : 'All done'}
                </div>
              </div>
            );
          })}

          {/* New deck node */}
          <div className="duo-node duo-node--new" style={{ transform: `translateX(${OFFSETS[decks.length % OFFSETS.length]}px)` }}>
            <div className="duo-node-circle">
              <button type="button" className="duo-node-btn" aria-label="Create a new deck" onClick={() => setShowCreate(true)}>
                <Plus className="h-10 w-10" strokeWidth={2.5} />
              </button>
            </div>
            <div className="duo-node-label" style={{ color: 'var(--ink-muted)' }}>New deck</div>
          </div>

          <div ref={sentinelRef} className="h-6" />
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}

      {showCreate && (
        <CreateDeckDialog
          title="New deck"
          placeholder="Deck name"
          submitLabel="Create"
          cancelLabel="Cancel"
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
