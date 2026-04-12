'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/hooks/use-auth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Card, Deck } from '@/types';

interface DeckWithCards extends Deck {
  cards: Card[];
}

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newType, setNewType] = useState('basic');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    fetchApi<DeckWithCards>(`/api/decks/${id}`)
      .then(setDeck)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !id) return;
    try {
      const result = await fetchApi<Card | Card[]>('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ deckId: id, front: newFront.trim(), back: newBack.trim(), type: newType }),
      });
      const newCards = Array.isArray(result) ? result : [result];
      setDeck((prev) => prev ? { ...prev, cards: [...prev.cards, ...newCards], cardCount: prev.cardCount + newCards.length } : prev);
      setNewFront('');
      setNewBack('');
      setNewType('basic');
      setShowCreate(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdate = async (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    try {
      const updated = await fetchApi<Card>(`/api/cards/${cardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ front: editFront.trim(), back: editBack.trim() }),
      });
      setDeck((prev) => prev ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? updated : c)) } : prev);
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingCard) return;
    try {
      await fetchApi(`/api/cards/${deletingCard.id}`, { method: 'DELETE' });
      setDeck((prev) => prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== deletingCard.id), cardCount: prev.cardCount - 1 } : prev);
      setDeletingCard(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!deck) return <ErrorMessage message="Deck not found" />;

  const cards = deck.cards;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/decks" className="flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-accent) transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Collections
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-bold text-(--color-text-primary) tracking-tight heading">{deck.name}</h1>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
              <span>{cards.length} cards total</span>
              <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent) opacity-50" />
              <span className="text-(--color-accent)">{deck.dueCount} due now</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push(`/review/${id}`)} className="px-8 py-3 bg-(--color-accent) text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" /></svg>
              Start Session
            </button>
            <button onClick={() => router.push(`/decks/${id}/settings`)} className="px-8 py-3 bg-white dark:bg-white/10 text-(--color-text-primary) border border-(--color-border) font-bold rounded-2xl hover:bg-(--color-bg-surface-hover) transition-all">
              FSRS Settings
            </button>
            <button onClick={() => setShowCreate(true)} className="px-8 py-3 bg-white dark:bg-white/10 text-(--color-text-primary) border border-(--color-border) font-bold rounded-2xl hover:bg-(--color-bg-surface-hover) transition-all">+ Add Card</button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="premium-card p-8 shadow-2xl">
          <h3 className="text-xl font-bold mb-6 heading">Craft a New Card</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Front side</label>
                <textarea autoFocus value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Question or prompt..." rows={3} className="w-full px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Back side</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Answer..." rows={3} className="w-full px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Card Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="bg-(--color-bg-page) border border-(--color-border) rounded-xl px-3 py-1.5 text-sm font-bold outline-none cursor-pointer">
                  <option value="basic">Basic</option>
                  <option value="reverse">Reverse</option>
                  <option value="cloze">Cloze</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowCreate(false); setNewFront(''); setNewBack(''); }} className="px-6 py-2 text-sm font-bold text-(--color-text-tertiary) hover:text-(--color-text-secondary)">Cancel</button>
                <button type="submit" className="button-primary px-8">Create Card</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-(--color-text-primary) px-2 heading">Memory Stack</h2>
        {cards.length === 0 ? (
          <EmptyState title="Empty stack" description="This collection is currently empty. Start adding some knowledge!" action={{ label: 'Craft Your First Card', onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="premium-card p-6 group hover:border-(--color-accent)">
                {editingId === card.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdate(card.id); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <textarea autoFocus value={editFront} onChange={(e) => setEditFront(e.target.value)} rows={2} className="w-full px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none resize-none" />
                      <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} rows={2} className="w-full px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none resize-none" />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="text-sm font-bold text-(--color-accent) hover:underline">Save Changes</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-sm font-bold text-(--color-text-muted)">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-lg font-bold text-(--color-text-primary) leading-tight">{card.front}</p>
                      <p className="text-sm text-(--color-text-secondary) mt-2 italic border-l-2 border-(--color-accent) pl-3">{card.back}</p>
                      <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-(--color-bg-muted) text-(--color-text-tertiary) rounded-md">{card.type}</span>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(card.id); setEditFront(card.front); setEditBack(card.back); }} className="p-2 text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-accent-muted) rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      </button>
                      <button onClick={() => setDeletingCard(card)} className="p-2 text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deletingCard && (
        <ConfirmDialog title="Archive Card" message={`Are you sure you want to remove "${deletingCard.front}" from the memory stack?`} onConfirm={handleDelete} onCancel={() => setDeletingCard(null)} />
      )}
    </div>
  );
}
