'use client';

import { Brain, Calculator, Cross, Landmark, Languages } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { deckKeys, deckListOptions } from '@/lib/queries/decks';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Deck } from '@/types';

const deckAccentStyles = [
  { badgeClass: 'deck-icon-medical', textClass: 'text-[#b43b00]', progressClass: 'bg-[#b43b00]', Icon: Cross },
  { badgeClass: 'deck-icon-language', textClass: 'text-[#0b69c7]', progressClass: 'bg-[#0b69c7]', Icon: Languages },
  { badgeClass: 'deck-icon-cognitive', textClass: 'text-[#22b95f]', progressClass: 'bg-[#22b95f]', Icon: Brain },
  { badgeClass: 'deck-icon-arts', textClass: 'text-[#dc8a00]', progressClass: 'bg-[#ff9d00]', Icon: Landmark },
  { badgeClass: 'deck-icon-math', textClass: 'text-[#5657dd]', progressClass: 'bg-[#5657dd]', Icon: Calculator },
];

export default function DeckListPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);

  const { data: decks = [], isPending, isError, error } = useQuery(deckListOptions);

  const createDeck = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Deck>('/api/decks', { method: 'POST', body: JSON.stringify({ name }) }),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.lists() });
      const previous = queryClient.getQueryData<Deck[]>(deckKeys.lists());
      queryClient.setQueryData<Deck[]>(deckKeys.lists(), (old = []) => [
        { id: 'temp-' + Date.now(), name, cardCount: 0, dueCount: 0, newCount: 0, createdAt: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _name, ctx) => {
      queryClient.setQueryData(deckKeys.lists(), ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
    },
  });

  const updateDeck = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetchApi<Deck>(`/api/decks/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.lists() });
      const previous = queryClient.getQueryData<Deck[]>(deckKeys.lists());
      queryClient.setQueryData<Deck[]>(deckKeys.lists(), (old = []) =>
        old.map((d) => (d.id === id ? { ...d, name } : d)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(deckKeys.lists(), ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
    },
  });

  const deleteDeck = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/decks/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: deckKeys.lists() });
      const previous = queryClient.getQueryData<Deck[]>(deckKeys.lists());
      queryClient.setQueryData<Deck[]>(deckKeys.lists(), (old = []) =>
        old.filter((d) => d.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(deckKeys.lists(), ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createDeck.mutate(newName.trim(), {
      onSuccess: () => {
        setNewName('');
        setShowCreate(false);
      },
    });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateDeck.mutate({ id, name: editName.trim() }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const handleDelete = () => {
    if (!deletingDeck) return;
    deleteDeck.mutate(deletingDeck.id, {
      onSuccess: () => setDeletingDeck(null),
    });
  };

  if (isPending) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load decks'} />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="decks-content-shell space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-(--color-text-primary) tracking-tight">
              Let&apos;s start <span className="text-(--color-accent)">strong!</span>
            </h1>
            <p className="text-sm md:text-base text-(--color-text-secondary) mt-2 font-medium">Welcome back. Ready for your daily challenge?</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="button-primary shadow-xl shadow-orange-500/20 py-3 md:py-2 whitespace-nowrap">+ New Deck</button>
        </div>

        {showCreate && (
          <div className="premium-card p-4 md:p-6 mb-4">
            <h3 className="text-lg font-bold mb-4 heading">Create New Deck</h3>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
              <input autoFocus={showCreate} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Spanish Vocabulary" className="flex-1 px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none" />
              <div className="flex gap-2">
                <button type="submit" className="button-primary flex-1 md:flex-none px-8 py-3 md:py-2">Create</button>
                <button type="button" onClick={() => { setShowCreate(false); setNewName(''); }} className="px-4 py-3 md:py-2 text-sm font-bold text-(--color-text-tertiary) hover:text-(--color-text-secondary) flex-1 md:flex-none">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <section className="pt-2">
          {decks.length === 0 ? (
            <EmptyState title="No collections yet" description="Start by creating your first deck of flashcards." action={{ label: 'Craft Your First Deck', onClick: () => setShowCreate(true) }} />
          ) : (
            <div className="decks-grid">
              {decks.map((deck, index) => {
                const accent = deckAccentStyles[index % deckAccentStyles.length];
                const DeckIcon = accent.Icon;
                const mastery = deck.cardCount > 0 ? Math.max(12, Math.min(98, Math.round(((deck.cardCount - deck.dueCount) / deck.cardCount) * 100))) : 0;

                return (
                  <div key={deck.id} className="deck-card-compact premium-card group">
                    {editingId === deck.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleUpdate(deck.id); }} className="flex-1 flex gap-2">
                        <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none" />
                        <button type="submit" className="text-sm font-bold text-(--color-accent) hover:underline">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-sm font-bold text-(--color-text-muted)">Cancel</button>
                      </form>
                    ) : (
                      <div className="deck-card-shell">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`deck-card-icon ${accent.badgeClass}`}><DeckIcon className="w-4 h-4" strokeWidth={2} /></div>
                          <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(deck.id); setEditName(deck.name); }} className="p-2 text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-accent-muted) rounded-xl transition-all" title="Edit Deck">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            <button onClick={() => setDeletingDeck(deck)} className="p-2 text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all" title="Delete Deck">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                        <Link href={`/decks/${deck.id}`} className="deck-card-link">
                          <h3 className="deck-card-title">{deck.name}</h3>
                          <div className="deck-card-meta">
                            <div className="deck-card-stat"><span className="deck-card-dot deck-card-dot-cards" />{deck.cardCount.toLocaleString()} Cards</div>
                            <div className={`deck-card-stat ${deck.dueCount > 0 ? accent.textClass : 'text-(--color-success)'}`}>
                              <span className={`deck-card-dot ${deck.dueCount > 0 ? 'bg-(--color-accent)' : 'bg-(--color-success)'}`} />
                              {deck.dueCount > 0 ? `${deck.dueCount} Due` : 'Finished'}
                            </div>
                          </div>
                          <div className="deck-card-progress">
                            <div className="deck-card-progress-labels"><span>Mastery {mastery}%</span><span>{deck.newCount ?? 0} New</span></div>
                            <div className="deck-card-progress-track"><div className={`deck-card-progress-fill ${accent.progressClass}`} style={{ width: `${mastery}%` }} /></div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {deletingDeck && (
        <ConfirmDialog title="Delete Deck" message={`Are you sure you want to delete "${deletingDeck.name}"? This will also delete all its cards.`} onConfirm={handleDelete} onCancel={() => setDeletingDeck(null)} />
      )}
    </div>
  );
}
