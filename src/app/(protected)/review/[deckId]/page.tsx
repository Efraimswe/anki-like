'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { reviewKeys, reviewSessionOptions } from '@/lib/queries/reviews';
import { deckKeys } from '@/lib/queries/decks';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getNow, getNowMs, isTestClockEnabled, getTestClockStartIso } from '@/lib/clock';
import type { DueCard, DueCardsResponse, Rating } from '@/types';
import { useTranslations } from 'next-intl';

const RATING_COLORS: Record<Rating, string> = {
  again: 'bg-(--color-rating-again) hover:bg-(--color-rating-again-hover)',
  hard:  'bg-(--color-rating-hard) hover:bg-(--color-rating-hard-hover)',
  good:  'bg-(--color-rating-good) hover:bg-(--color-rating-good-hover)',
  easy:  'bg-(--color-rating-easy) hover:bg-(--color-rating-easy-hover)',
};

function findNextDueIndex(cards: DueCard[], startIndex: number): number {
  const now = getNow();
  for (let i = startIndex; i < cards.length; i++) {
    if (!cards[i].dueDate || new Date(cards[i].dueDate) <= now) return i;
  }
  return -1;
}

function getNextDueTime(cards: DueCard[], startIndex: number): Date | null {
  let earliest: Date | null = null;
  for (let i = startIndex; i < cards.length; i++) {
    if (cards[i].dueDate) {
      const d = new Date(cards[i].dueDate);
      if (!earliest || d < earliest) earliest = d;
    }
  }
  return earliest;
}

export default function ReviewSession() {
  // i18n-keys: ["again", "hard", "good", "easy"]
  const t = useTranslations('review');
  const { deckId } = useParams<{ deckId: string }>();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [remainingNew, setRemainingNew] = useState(0);
  const [remainingReviews, setRemainingReviews] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [waitingUntil, setWaitingUntil] = useState<Date | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const cardStartTime = useRef(getNowMs());
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: initialSession, isPending: sessionLoading, isError: sessionError, error: sessionErrorObj } = useQuery(reviewSessionOptions(deckId));

  // Initialize local state from query result on first load
  useEffect(() => {
    if (!initialSession || initialized) return;
    setCards(initialSession.cards);
    setCurrentIndex(0);
    setRemainingNew(initialSession.remainingNew);
    setRemainingReviews(initialSession.remainingReviews);
    if (initialSession.cards.length === 0) setDone(true);
    setInitialized(true);
  }, [initialSession, initialized]);

  const submitReview = useMutation({
    mutationFn: (payload: { cardId: string; rating: Rating; timeTakenMs: number }) =>
      fetchApi('/api/reviews/submit', { method: 'POST', body: JSON.stringify(payload) }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.session(deckId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.dailyLimits });
      queryClient.invalidateQueries({ queryKey: deckKeys.all });
    },
  });

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetchApi<DueCardsResponse>(`/api/reviews/session/${deckId}`);
      setCards(res.cards);
      setCurrentIndex(0);
      setRemainingNew(res.remainingNew);
      setRemainingReviews(res.remainingReviews);
      if (res.cards.length === 0) setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cards');
    }
  }, [deckId]);

  useEffect(() => () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); }, []);

  const startWaitingFor = (dueTime: Date) => {
    setWaitingUntil(dueTime);
    setWaitSeconds(Math.max(0, Math.ceil((dueTime.getTime() - getNowMs()) / 1000)));
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    waitTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((dueTime.getTime() - getNowMs()) / 1000);
      if (remaining <= 0) {
        clearInterval(waitTimerRef.current!);
        setWaitingUntil(null);
        setWaitSeconds(0);
        fetchCards();
      } else {
        setWaitSeconds(remaining);
      }
    }, 1000);
  };

  const showCard = (cardsList: DueCard[], idx: number) => {
    setCards(cardsList);
    setCurrentIndex(idx);
    setRevealed(false);
    cardStartTime.current = getNowMs();
  };

  const advanceToNextCard = async (nextIndex: number) => {
    if (nextIndex < cards.length) {
      showCard(cards, nextIndex);
      return;
    }
    const res = await fetchApi<DueCardsResponse>(`/api/reviews/session/${deckId}`);
    setRemainingNew(res.remainingNew);
    setRemainingReviews(res.remainingReviews);
    if (res.cards.length === 0) { setDone(true); return; }
    const dueIdx = findNextDueIndex(res.cards, 0);
    if (dueIdx >= 0) { showCard(res.cards, dueIdx); return; }
    const nextDue = getNextDueTime(res.cards, 0);
    if (nextDue) {
      const waitMs = nextDue.getTime() - getNowMs();
      if (waitMs <= 60_000) { showCard(res.cards, 0); } else { setCards(res.cards); setCurrentIndex(0); startWaitingFor(nextDue); }
    } else { setDone(true); }
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

  if (waitingUntil) {
    const mins = Math.floor(waitSeconds / 60);
    const secs = waitSeconds % 60;
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-(--color-text-primary)">{t('waitingTitle')}</h2>
        <p className="text-(--color-text-tertiary) mt-2">{t('waitingMessage')} <span className="font-mono text-(--color-accent-text) text-lg">{mins > 0 ? `${mins}m ` : ''}{secs.toString().padStart(2, '0')}s</span></p>
        <p className="text-(--color-text-muted) mt-1 text-sm">{t('waitingReviewed', { count: reviewedCount })}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-(--color-text-primary)">{t('completedTitle')}</h2>
        <p className="text-(--color-text-tertiary) mt-2">{t('completedMessage', { count: reviewedCount })}</p>
        <Link href={`/decks/${deckId}`} className="inline-block mt-6 px-6 py-2 bg-(--color-accent) text-white rounded-md hover:bg-(--color-accent-hover) transition-colors">{t('completedBack')}</Link>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-10">
        <Link href={`/decks/${deckId}`} className="flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-accent) transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          {t('backButton')}
        </Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
          <span className="text-(--color-text-primary)">{currentIndex + 1} {t('of')} {cards.length}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>{remainingNew} {t('newCards')}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>{remainingReviews} {t('reviewCards')}</span>
        </div>
      </div>
      {isTestClockEnabled() && (
        <div className="mb-6 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          {t('testClockWarning', { time: getTestClockStartIso() })}
        </div>
      )}

      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-(--color-accent) to-orange-400 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-500" />
        <div className="relative premium-card p-12 text-center min-h-[400px] flex flex-col justify-center items-center shadow-2xl border-none">
          <div className="mb-auto w-full">
            <div className="h-1.5 bg-(--color-bg-page) rounded-full overflow-hidden w-full">
              <div className="h-full bg-linear-to-r from-(--color-accent) to-orange-400 transition-all duration-500 rounded-full" style={{ width: `${(currentIndex / cards.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center w-full py-10">
            <h2 className="text-4xl font-bold text-(--color-text-primary) heading whitespace-pre-wrap leading-tight">{card.front}</h2>
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="mt-12 button-primary px-12 py-4 shadow-xl shadow-orange-500/20 text-lg">{t('revealButton')}</button>
            ) : (
              <div className="mt-12 w-full">
                <div className="h-px bg-linear-to-r from-transparent via-(--color-border) to-transparent mb-12" />
                <p className="text-2xl text-(--color-text-secondary) font-medium whitespace-pre-wrap leading-relaxed">{card.back}</p>
                <div className="mt-16 flex flex-wrap justify-center gap-4">
                  {(['again', 'hard', 'good', 'easy'] as const).map((rating) => {
                    const hint = card.intervalHints?.[rating];
                    return (
                      <button key={rating} disabled={submitReview.isPending} onClick={() => handleRate(rating)} className={`flex flex-col items-center px-8 py-4 text-white text-sm font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg ${RATING_COLORS[rating]}`}>
                        <span>{t(rating)}</span>
                        {hint && <span className="text-[10px] opacity-80 mt-1 uppercase tracking-tighter">{hint}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 text-center">
        <p className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">{t('keyboardHint')}</p>
      </div>
    </div>
  );
}
