'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchApi } from '@/lib/auth-client';
import { reviewKeys, reviewSessionOptions } from '@/lib/queries/reviews';
import { deckKeys } from '@/lib/queries/decks';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Owl from '@/components/ui/Owl';
import { getNowMs, isTestClockEnabled, getTestClockStartIso } from '@/lib/clock';
import type { DueCard, DueCardsResponse, Rating } from '@/types';

const RATING_BTN: Record<Rating, string> = {
  again: 'btn-red',
  hard: 'btn-orange',
  good: 'btn-green',
  easy: 'btn-blue',
};
const RATING_LABELS: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

export default function ReviewSession() {
  const { deckId } = useParams<{ deckId: string }>();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const cardStartTime = useRef(getNowMs());

  const { data: initialSession, isError: sessionError, error: sessionErrorObj } = useQuery(reviewSessionOptions(deckId));

  useEffect(() => {
    if (!initialSession || initialized) return;
    setCards(initialSession.cards);
    setCurrentIndex(0);
    if (initialSession.cards.length === 0) setDone(true);
    setInitialized(true);
  }, [initialSession, initialized]);

  const submitReview = useMutation({
    mutationFn: (payload: { cardId: string; rating: Rating; timeTakenMs: number }) =>
      fetchApi('/api/reviews/submit', { method: 'POST', body: JSON.stringify(payload) }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.session(deckId) });
      queryClient.invalidateQueries({ queryKey: deckKeys.all });
    },
  });

  const showCard = (list: DueCard[], idx: number) => {
    setCards(list);
    setCurrentIndex(idx);
    setRevealed(false);
    cardStartTime.current = getNowMs();
  };

  const advanceToNextCard = async (nextIndex: number) => {
    if (nextIndex < cards.length) { showCard(cards, nextIndex); return; }
    const res = await fetchApi<DueCardsResponse>(`/api/reviews/session/${deckId}`);
    if (res.cards.length === 0) { setDone(true); return; }
    showCard(res.cards, 0);
  };

  const handleRate = async (rating: Rating) => {
    const card = cards[currentIndex];
    if (!card || submitReview.isPending) return;
    const timeTakenMs = getNowMs() - cardStartTime.current;
    try {
      await submitReview.mutateAsync({ cardId: card.id, rating, timeTakenMs });
      setReviewedCount((c) => c + 1);
      await advanceToNextCard(currentIndex + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review submission failed');
    }
  };

  if (!initialized) return <LoadingSpinner />;
  if (sessionError || error) return <ErrorMessage message={error || (sessionErrorObj instanceof Error ? sessionErrorObj.message : 'Failed to load session')} />;

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
        <Owl size={120} className="owl-bob" />
        <h2 className="font-display mt-6 text-3xl font-extrabold">Lesson complete!</h2>
        <p className="mt-2 font-bold" style={{ color: 'var(--ink-muted)' }}>
          You reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'}. Nice work.
        </p>
        <Link href={`/decks/${deckId}`} className="button-primary mt-8 inline-flex items-center justify-center">Continue</Link>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Lesson top bar */}
      <div className="lesson-topbar mb-8">
        <Link href={`/decks/${deckId}`} className="btn-spring shrink-0 rounded-xl p-1" style={{ color: 'var(--ink-soft)' }} aria-label="Close lesson">
          <X className="h-7 w-7" strokeWidth={3} />
        </Link>
        <div className="lesson-progress">
          <div className="lesson-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isTestClockEnabled() && (
        <div className="mb-6 rounded-2xl border-2 px-4 py-3 text-sm font-bold" style={{ borderColor: 'var(--duo-gold)', background: '#FFF8DC', color: '#7A5C00' }}>
          Test clock active — simulating time from {getTestClockStartIso()}
        </div>
      )}

      {/* Prompt */}
      <div className="flex min-h-70 flex-col items-center justify-center rounded-3xl border-2 px-6 py-12 text-center" style={{ borderColor: 'var(--rule)', background: 'var(--surface)' }}>
        <p className="eyebrow mb-3">Translate</p>
        <h2 className="font-display text-4xl font-extrabold" style={{ color: 'var(--ink)' }}>{card.word}</h2>
        {revealed && (
          <>
            <div className="my-6 h-0.5 w-24" style={{ background: 'var(--rule)' }} />
            <p className="text-2xl font-extrabold" style={{ color: 'var(--duo-green)' }}>{card.translate}</p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8">
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="button-primary w-full">Show answer</button>
        ) : (
          <div>
            <p className="eyebrow mb-3 text-center">How well did you know it?</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['again', 'hard', 'good', 'easy'] as const).map((rating) => {
                const hint = card.intervalHints?.[rating];
                return (
                  <button key={rating} disabled={submitReview.isPending} onClick={() => handleRate(rating)} className={`btn-3d ${RATING_BTN[rating]} flex flex-col items-center gap-0.5`}>
                    <span>{RATING_LABELS[rating]}</span>
                    {hint && <span className="text-[10px] font-bold opacity-80">{hint}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
