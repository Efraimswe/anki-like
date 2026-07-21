'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData, queryOptions } from '@tanstack/react-query';
import { Pencil, Trash2, Play, Plus, Check, X } from 'lucide-react';
import { fetchApi } from '@/lib/auth-client';
import { deckKeys } from '@/lib/queries/decks';
import type { GeneratedWord } from '@/lib/generate-words';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import type { Card, Deck } from '@/types';

interface DeckWithCards extends Deck {
  cards: Card[];
}

const inputCls =
  'w-full rounded-2xl border-2 px-4 py-3 font-bold text-(--ink) outline-none focus:border-(--duo-blue)';

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // add-card flow
  const [showCreate, setShowCreate] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [options, setOptions] = useState<string[] | null>(null);
  const [manualTranslate, setManualTranslate] = useState('');

  // generate-words flow
  const [showGenerator, setShowGenerator] = useState(false);
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [genCount, setGenCount] = useState<5 | 10>(5);
  const [genTheme, setGenTheme] = useState('');
  const [genWords, setGenWords] = useState<GeneratedWord[] | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [seenWords, setSeenWords] = useState<string[]>([]);

  // edit card
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editTranslate, setEditTranslate] = useState('');
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // deck header edit
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [editingAddLimit, setEditingAddLimit] = useState(false);
  const [addLimitInput, setAddLimitInput] = useState('');

  const deckWithCardsOptions = queryOptions({
    queryKey: deckKeys.detail(id),
    queryFn: () => fetchApi<DeckWithCards>(`/api/decks/${id}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
  const { data: deck, isPending, isError, error, refetch } = useQuery(deckWithCardsOptions);

  const fetchOptions = useMutation({
    mutationFn: (word: string) => fetchApi<{ options: string[] }>(`/api/translate?word=${encodeURIComponent(word)}`),
    onSuccess: ({ options }) => setOptions(options),
    onError: () => setOptions([]),
  });

  const generateWords = useMutation({
    mutationFn: () =>
      fetchApi<{ words: GeneratedWord[] }>('/api/generate-words', {
        method: 'POST',
        body: JSON.stringify({ difficulty: genDifficulty, count: genCount, theme: genTheme.trim() || undefined, exclude: seenWords }),
      }),
    onSuccess: ({ words }) => {
      setGenWords(words);
      setSeenWords((prev) => Array.from(new Set([...prev, ...words.map((w) => w.word)])));
    },
    onError: () => setGenWords([]),
  });

  const createCard = useMutation({
    mutationFn: ({ word, translate }: { word: string; translate: string }) =>
      fetchApi<Card>('/api/cards', { method: 'POST', body: JSON.stringify({ deckId: id, word, translate }) }),
    onSuccess: (card) => {
      queryClient.setQueryData<DeckWithCards>(deckKeys.detail(id), (prev) =>
        prev ? { ...prev, cards: [card, ...prev.cards], cardCount: prev.cardCount + 1, addedToday: (prev.addedToday ?? 0) + 1 } : prev,
      );
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
      toast({ type: 'success', title: 'Card added', description: `${card.word} → ${card.translate}` });
      resetAddCard();
    },
    onError: (err) => toast({ type: 'error', title: 'Could not add card', description: err instanceof Error ? err.message : 'Please try again.' }),
  });

  const updateCard = useMutation({
    mutationFn: ({ cardId, word, translate }: { cardId: string; word: string; translate: string }) =>
      fetchApi<Card>(`/api/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify({ word, translate }) }),
    onMutate: async ({ cardId, word, translate }) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.detail(id) });
      const previous = queryClient.getQueryData<DeckWithCards>(deckKeys.detail(id));
      queryClient.setQueryData<DeckWithCards>(deckKeys.detail(id), (prev) =>
        prev ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? { ...c, word, translate } : c)) } : prev,
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(deckKeys.detail(id), ctx?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: deckKeys.detail(id) }),
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => fetchApi(`/api/cards/${cardId}`, { method: 'DELETE' }),
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.detail(id) });
      const previous = queryClient.getQueryData<DeckWithCards>(deckKeys.detail(id));
      queryClient.setQueryData<DeckWithCards>(deckKeys.detail(id), (prev) =>
        prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== cardId), cardCount: prev.cardCount - 1 } : prev,
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => queryClient.setQueryData(deckKeys.detail(id), ctx?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
    },
  });

  const updateDeck = useMutation({
    mutationFn: (body: { name?: string; dailyReviewLimit?: number; dailyAddLimit?: number }) =>
      fetchApi<Deck>(`/api/decks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.detail(id) });
      const previous = queryClient.getQueryData<DeckWithCards>(deckKeys.detail(id));
      queryClient.setQueryData<DeckWithCards>(deckKeys.detail(id), (prev) => (prev ? { ...prev, ...body } : prev));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      queryClient.setQueryData(deckKeys.detail(id), ctx?.previous);
      toast({ type: 'error', title: 'Could not save', description: err instanceof Error ? err.message : 'Please try again.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
    },
  });

  function resetAddCard() {
    setNewWord('');
    setOptions(null);
    setManualTranslate('');
    setShowCreate(false);
  }

  const handleFindTranslations = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim();
    if (!word) return;
    setOptions(null);
    fetchOptions.mutate(word);
  };

  const handlePick = (translate: string) => {
    const word = newWord.trim();
    if (!word || !translate.trim()) return;
    createCard.mutate({ word, translate: translate.trim() });
  };

  const saveName = () => {
    const name = nameInput.trim();
    if (name && name !== deck?.name) updateDeck.mutate({ name });
    setEditingName(false);
  };
  const saveLimit = () => {
    const n = parseInt(limitInput, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 9999) updateDeck.mutate({ dailyReviewLimit: n });
    setEditingLimit(false);
  };
  const saveAddLimit = () => {
    const n = parseInt(addLimitInput, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 9999) updateDeck.mutate({ dailyAddLimit: n });
    setEditingAddLimit(false);
  };

  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load your vocabulary'} onRetry={() => refetch()} />;
  if (!isPending && !deck) return <ErrorMessage message="Vocabulary not found" />;

  const cards = deck?.cards ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isPending ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Header card */}
          <div className="premium-card p-6">
            <div className="flex items-start justify-between gap-3">
              {editingName ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className={`${inputCls} text-2xl`}
                    style={{ borderColor: 'var(--rule)' }}
                  />
                  <button onClick={saveName} className="btn-spring rounded-xl p-2" style={{ color: 'var(--duo-green)' }} aria-label="Save name"><Check strokeWidth={3} /></button>
                  <button onClick={() => setEditingName(false)} className="btn-spring rounded-xl p-2" style={{ color: 'var(--ink-soft)' }} aria-label="Cancel"><X strokeWidth={3} /></button>
                </div>
              ) : (
                <h1 className="font-display flex-1 text-3xl font-extrabold">{deck!.name}</h1>
              )}
              {!editingName && (
                <div className="flex gap-1">
                  <button onClick={() => setShowGenerator(true)} className="btn-spring rounded-xl p-2" style={{ color: 'var(--ink-muted)' }} aria-label="Generate words">
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                  <button onClick={() => { setNameInput(deck!.name); setEditingName(true); }} className="btn-spring rounded-xl p-2" style={{ color: 'var(--ink-muted)' }} aria-label="Rename vocabulary">
                    <Pencil className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>
              <span>{cards.length} {cards.length === 1 ? 'card' : 'cards'}</span>
              {editingLimit ? (
                <span className="flex items-center gap-1.5 normal-case">
                  <input
                    type="number" min={1} max={9999} autoFocus value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveLimit(); if (e.key === 'Escape') setEditingLimit(false); }}
                    className="w-16 rounded-lg border-2 px-2 py-1 text-sm" style={{ borderColor: 'var(--rule)' }}
                  />
                  <button onClick={saveLimit} className="font-extrabold" style={{ color: 'var(--duo-green)' }}>save</button>
                </span>
              ) : (
                <button onClick={() => { setLimitInput(String(deck!.dailyReviewLimit)); setEditingLimit(true); }} className="hover:underline" style={{ color: 'var(--duo-blue)' }}>
                  {deck!.dailyReviewLimit}/day ✎
                </button>
              )}
              {editingAddLimit ? (
                <span className="flex items-center gap-1.5 normal-case">
                  <input
                    type="number" min={1} max={9999} autoFocus value={addLimitInput}
                    onChange={(e) => setAddLimitInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveAddLimit(); if (e.key === 'Escape') setEditingAddLimit(false); }}
                    className="w-16 rounded-lg border-2 px-2 py-1 text-sm" style={{ borderColor: 'var(--rule)' }}
                  />
                  <button onClick={saveAddLimit} className="font-extrabold" style={{ color: 'var(--duo-green)' }}>save</button>
                </span>
              ) : (
                <button onClick={() => { setAddLimitInput(String(deck!.dailyAddLimit)); setEditingAddLimit(true); }} className="hover:underline" style={{ color: 'var(--duo-blue)' }}>
                  {deck!.dailyAddLimit} added/day ✎
                </button>
              )}
              <span style={{ color: 'var(--duo-green)' }}>{deck!.dueCount ?? 0} to review today</span>
              <span>{deck!.addedToday ?? 0} added today</span>
              <span>{deck!.reviewedToday ?? 0} reviewed today</span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push(`/review/${id}`)} className="btn-3d btn-green flex flex-1 items-center justify-center gap-2">
                <Play className="h-5 w-5" strokeWidth={3} /> Start review
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-3d btn-blue flex flex-1 items-center justify-center gap-2">
                <Plus className="h-5 w-5" strokeWidth={3} /> Add card
              </button>
            </div>
          </div>

          {/* Add-card flow */}
          {showCreate && (
            <div className="premium-card p-6">
              <h3 className="font-display mb-4 text-lg font-extrabold">Add a card</h3>
              <form onSubmit={handleFindTranslations} className="space-y-3">
                <label className="eyebrow block">English word</label>
                <input
                  autoFocus value={newWord}
                  onChange={(e) => { setNewWord(e.target.value); setOptions(null); }}
                  placeholder="e.g. house"
                  className={inputCls} style={{ borderColor: 'var(--rule)' }}
                />
                <div className="flex gap-3">
                  <button type="button" onClick={resetAddCard} className="btn-3d btn-gray flex-1">Cancel</button>
                  <button type="submit" disabled={!newWord.trim() || fetchOptions.isPending} className="btn-3d btn-green flex-1">
                    {fetchOptions.isPending ? 'Finding…' : 'Find'}
                  </button>
                </div>
              </form>

              {fetchOptions.isPending && <div className="mt-5"><LoadingSpinner /></div>}

              {options !== null && !fetchOptions.isPending && (
                <div className="mt-5 space-y-3">
                  {options.length > 0 ? (
                    <>
                      <p className="eyebrow">Pick a translation</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt, i) => (
                          <button
                            key={i} onClick={() => handlePick(opt)} disabled={createCard.isPending}
                            className="btn-spring rounded-2xl border-2 px-4 py-2.5 font-extrabold disabled:opacity-50"
                            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>No translations found. Enter one below.</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      value={manualTranslate}
                      onChange={(e) => setManualTranslate(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && manualTranslate.trim()) handlePick(manualTranslate); }}
                      placeholder="Or type your own"
                      className={inputCls} style={{ borderColor: 'var(--rule)' }}
                    />
                    <button onClick={() => handlePick(manualTranslate)} disabled={!manualTranslate.trim() || createCard.isPending} className="btn-3d btn-green">Add</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate-words flow */}
          {showGenerator && (
            <div className="premium-card p-6">
              <h3 className="font-display mb-4 text-lg font-extrabold">Generate words</h3>
              <div className="space-y-3">
                <label className="eyebrow block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d} type="button" onClick={() => setGenDifficulty(d)}
                      className="btn-spring rounded-2xl border-2 px-4 py-2.5 font-extrabold capitalize"
                      style={genDifficulty === d
                        ? { borderColor: 'var(--duo-blue)', backgroundColor: 'var(--duo-blue-haze)', color: 'var(--duo-blue)' }
                        : { borderColor: 'var(--rule)', color: 'var(--ink)' }}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <label className="eyebrow block">Words</label>
                <div className="flex flex-wrap gap-2">
                  {([5, 10] as const).map((n) => (
                    <button
                      key={n} type="button" onClick={() => setGenCount(n)}
                      className="btn-spring rounded-2xl border-2 px-4 py-2.5 font-extrabold"
                      style={genCount === n
                        ? { borderColor: 'var(--duo-blue)', backgroundColor: 'var(--duo-blue-haze)', color: 'var(--duo-blue)' }
                        : { borderColor: 'var(--rule)', color: 'var(--ink)' }}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <input
                  value={genTheme}
                  onChange={(e) => setGenTheme(e.target.value)}
                  placeholder="Theme (optional) — e.g. travel"
                  className={inputCls} style={{ borderColor: 'var(--rule)' }}
                />

                {seenWords.length > 0 && (
                  <p className="text-xs font-bold" style={{ color: 'var(--ink-soft)' }}>Avoiding {seenWords.length} previous words</p>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowGenerator(false); setGenWords(null); }} className="btn-3d btn-gray flex-1">Cancel</button>
                  <button type="button" onClick={() => generateWords.mutate()} disabled={generateWords.isPending} className="btn-3d btn-green flex-1">
                    {generateWords.isPending ? 'Finding…' : 'Find'}
                  </button>
                </div>
              </div>

              {generateWords.isPending && <div className="mt-5"><LoadingSpinner /></div>}

              {genWords !== null && !generateWords.isPending && (
                <div className="mt-5 space-y-3">
                  {genWords.length === 0 ? (
                    <p className="text-sm font-bold" style={{ color: 'var(--ink-muted)' }}>No words returned. Try again.</p>
                  ) : (
                    genWords.map((w, i) => {
                      const added = addedWords.has(w.word);
                      return (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-extrabold" style={{ color: 'var(--ink)' }}>{w.word}</p>
                            <p className="truncate font-bold" style={{ color: 'var(--ink-muted)' }}>{w.translate}</p>
                          </div>
                          <button
                            type="button"
                            disabled={added || createCard.isPending}
                            onClick={() => { createCard.mutate({ word: w.word, translate: w.translate }); setAddedWords((prev) => new Set(prev).add(w.word)); }}
                            className="btn-3d btn-green flex shrink-0 items-center gap-1.5"
                          >
                            {added ? (<><Check className="h-4 w-4" strokeWidth={3} /> Added</>) : 'Add'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card list */}
          {cards.length === 0 ? (
            <EmptyState title="No cards yet" description="Add your first card to start studying." action={{ label: 'Add card', onClick: () => setShowCreate(true) }} />
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="premium-card p-4">
                  {editingId === card.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (editWord.trim() && editTranslate.trim()) { updateCard.mutate({ cardId: card.id, word: editWord.trim(), translate: editTranslate.trim() }); setEditingId(null); } }} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input autoFocus value={editWord} onChange={(e) => setEditWord(e.target.value)} className={inputCls} style={{ borderColor: 'var(--rule)' }} />
                        <input value={editTranslate} onChange={(e) => setEditTranslate(e.target.value)} className={inputCls} style={{ borderColor: 'var(--rule)' }} />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="btn-3d btn-green">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-3d btn-gray">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-extrabold" style={{ color: 'var(--ink)' }}>{card.word}</p>
                        <p className="truncate font-bold" style={{ color: 'var(--ink-muted)' }}>{card.translate}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => { setEditingId(card.id); setEditWord(card.word); setEditTranslate(card.translate); }} className="btn-spring rounded-xl p-2" style={{ color: 'var(--ink-muted)' }} aria-label="Edit card">
                          <Pencil className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <button onClick={() => setDeletingCard(card)} className="btn-spring rounded-xl p-2" style={{ color: 'var(--duo-red)' }} aria-label="Delete card">
                          <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {deletingCard && (
        <ConfirmDialog title="Delete card" message={`Delete "${deletingCard.word}"? This cannot be undone.`} onConfirm={() => { deleteCard.mutate(deletingCard.id); setDeletingCard(null); }} onCancel={() => setDeletingCard(null)} />
      )}
    </div>
  );
}
