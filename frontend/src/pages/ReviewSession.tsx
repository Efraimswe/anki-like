import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { DueCard, Rating } from '../api/types';
import { getDueCards, submitReview } from '../api/reviews';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const RATINGS: { value: Rating; label: string; color: string }[] = [
  { value: 'again', label: 'Again', color: 'bg-(--color-rating-again) hover:bg-(--color-rating-again-hover)' },
  { value: 'hard', label: 'Hard', color: 'bg-(--color-rating-hard) hover:bg-(--color-rating-hard-hover)' },
  { value: 'good', label: 'Good', color: 'bg-(--color-rating-good) hover:bg-(--color-rating-good-hover)' },
  { value: 'easy', label: 'Easy', color: 'bg-(--color-rating-easy) hover:bg-(--color-rating-easy-hover)' },
];

/** Find the next card that is actually due (dueDate <= now). Returns -1 if none are due yet. */
function findNextDueIndex(cards: DueCard[], startIndex: number): number {
  const now = new Date();
  for (let i = startIndex; i < cards.length; i++) {
    if (!cards[i].dueDate || new Date(cards[i].dueDate) <= now) return i;
  }
  return -1;
}

/** Get the soonest due date from remaining cards. */
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
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [remainingNew, setRemainingNew] = useState(0);
  const [remainingReviews, setRemainingReviews] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [waitingUntil, setWaitingUntil] = useState<Date | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const cardStartTime = useRef(Date.now());
  const waitTimerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchCards = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getDueCards(id)
      .then((res) => {
        setCards(res.cards);
        setCurrentIndex(0);
        setRemainingNew(res.remainingNew);
        setRemainingReviews(res.remainingReviews);
        if (res.cards.length === 0) setDone(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Cleanup wait timer
  useEffect(() => () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); }, []);

  const startWaitingFor = (dueTime: Date) => {
    setWaitingUntil(dueTime);
    setWaitSeconds(Math.max(0, Math.ceil((dueTime.getTime() - Date.now()) / 1000)));
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    waitTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((dueTime.getTime() - Date.now()) / 1000);
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
    cardStartTime.current = Date.now();
  };

  const advanceToNextCard = async (nextIndex: number) => {
    if (nextIndex < cards.length) {
      showCard(cards, nextIndex);
      return;
    }

    const res = await getDueCards(id!);
    setRemainingNew(res.remainingNew);
    setRemainingReviews(res.remainingReviews);

    if (res.cards.length === 0) {
      setDone(true);
      return;
    }

    const dueIdx = findNextDueIndex(res.cards, 0);
    if (dueIdx >= 0) {
      showCard(res.cards, dueIdx);
      return;
    }

    const nextDue = getNextDueTime(res.cards, 0);
    if (nextDue) {
      const waitMs = nextDue.getTime() - Date.now();
      if (waitMs <= 60_000) {
        showCard(res.cards, 0);
      } else {
        setCards(res.cards);
        setCurrentIndex(0);
        startWaitingFor(nextDue);
      }
    } else {
      setDone(true);
    }
  };

  const handleRate = async (rating: Rating) => {
    const card = cards[currentIndex];
    if (!card || submitting) return;
    setSubmitting(true);
    const timeTakenMs = Date.now() - cardStartTime.current;
    try {
      await submitReview(card.id, rating, timeTakenMs);
      setReviewedCount((c) => c + 1);
      await advanceToNextCard(currentIndex + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  if (waitingUntil) {
    const mins = Math.floor(waitSeconds / 60);
    const secs = waitSeconds % 60;
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-(--color-text-primary)">Waiting for learning cards...</h2>
        <p className="text-(--color-text-tertiary) mt-2">
          Next card due in{' '}
          <span className="font-mono text-(--color-accent-text) text-lg">
            {mins > 0 ? `${mins}m ` : ''}{secs.toString().padStart(2, '0')}s
          </span>
        </p>
        <p className="text-(--color-text-muted) mt-1 text-sm">
          You've reviewed {reviewedCount} card{reviewedCount !== 1 ? 's' : ''} so far.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-(--color-text-primary)">Session Complete!</h2>
        <p className="text-(--color-text-tertiary) mt-2">
          You reviewed {reviewedCount} card{reviewedCount !== 1 ? 's' : ''}.
        </p>
        <Link
          to={`/decks/${id}`}
          className="inline-block mt-6 px-6 py-2 bg-(--color-accent) text-white rounded-md hover:bg-(--color-accent-hover) transition-colors"
        >
          Back to Deck
        </Link>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-10">
        <Link 
          to={`/decks/${id}`} 
          className="flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-accent) transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Collection
        </Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
          <span className="text-(--color-text-primary)">{currentIndex + 1} of {cards.length}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>{remainingNew} New</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>{remainingReviews} Reviews</span>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-(--color-accent) to-orange-400 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
        <div className="relative premium-card p-12 text-center min-h-[400px] flex flex-col justify-center items-center shadow-2xl border-none">
          <div className="mb-auto w-full">
             <div className="h-1.5 bg-(--color-bg-page) rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-linear-to-r from-(--color-accent) to-orange-400 transition-all duration-500 rounded-full"
                  style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                />
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full py-10">
            <h2 className="text-4xl font-bold text-(--color-text-primary) heading whitespace-pre-wrap leading-tight">
              {card.front}
            </h2>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="mt-12 button-primary px-12 py-4 shadow-xl shadow-orange-500/20 text-lg"
              >
                Reveal Answer
              </button>
            ) : (
              <div className="mt-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px bg-linear-to-r from-transparent via-(--color-border) to-transparent mb-12"></div>
                <p className="text-2xl text-(--color-text-secondary) font-medium whitespace-pre-wrap leading-relaxed">
                  {card.back}
                </p>
                
                <div className="mt-16 flex flex-wrap justify-center gap-4">
                  {RATINGS.map((r) => {
                    const hint = card.intervalHints?.[r.value];
                    return (
                      <button
                        key={r.value}
                        disabled={submitting}
                        onClick={() => handleRate(r.value)}
                        className={`flex flex-col items-center px-8 py-4 text-white text-sm font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg ${r.color}`}
                      >
                        <span>{r.label}</span>
                        {hint && (
                          <span className="text-[10px] opacity-80 mt-1 uppercase tracking-tighter">{hint}</span>
                        )}
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
        <p className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
          Press Space to reveal &middot; Keys 1-4 to rate
        </p>
      </div>
    </div>
  );
}
