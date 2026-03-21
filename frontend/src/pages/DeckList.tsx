import { useEffect, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import { createDeck, deleteDeck, getDecks, updateDeck } from '../api/decks';
import { getDailyLimits, updateDailyLimits } from '../api/statistics';
import type { DailyLimits, Deck } from '../api/types';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DeckList() {
	const [decks, setDecks] = useState<Deck[]>([]);
	const [limits, setLimits] = useState<DailyLimits | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [newName, setNewName] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);
	const [editingLimits, setEditingLimits] = useState(false);
	const [maxNew, setMaxNew] = useState(20);
	const [maxReviews, setMaxReviews] = useState(200);
	const container = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (loading) return;

			// Header, Stats, and Decks entrance (Only runs once when loaded)
			const tl = gsap.timeline();
			tl.to('.page-header', {
				y: 0,
				opacity: 1,
				duration: 0.6,
				ease: 'power2.out',
			})
				.to(
					'.stat-card',
					{
						scale: 1,
						opacity: 1,
						duration: 0.5,
						stagger: 0.1,
						ease: 'back.out(1.2)',
					},
					'-=0.4',
				)
				.to(
					'.deck-card',
					{
						y: 0,
						opacity: 1,
						duration: 0.6,
						stagger: 0.08,
						ease: 'power2.out',
					},
					'-=0.3',
				);
		},
		{ scope: container, dependencies: [loading] },
	);

	useGSAP(
		() => {
			// Forms pop (Only triggers when these specific dependencies change)
			if (showCreate) {
				gsap.to('.create-form-gsap', {
					scale: 1,
					opacity: 1,
					duration: 0.4,
					ease: 'back.out(1.7)',
				});
			}

			if (editingLimits) {
				gsap.to('.limits-form-gsap', {
					scale: 1,
					opacity: 1,
					duration: 0.4,
					ease: 'back.out(1.7)',
				});
			}
		},
		{ scope: container, dependencies: [showCreate, editingLimits] },
	);

	const load = () => {
		setLoading(true);
		setError('');
		Promise.all([getDecks(), getDailyLimits()])
			.then(([d, l]) => {
				setDecks(d);
				setLimits(l);
				setMaxNew(l.maxNewCards);
				setMaxReviews(l.maxReviews);
			})
			.catch(e => setError(e.message))
			.finally(() => setLoading(false));
	};

	useEffect(load, []);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName.trim()) return;
		try {
			const deck = await createDeck(newName.trim());
			setDecks(prev => [...prev, deck]);
			setNewName('');
			setShowCreate(false);
		} catch (e: any) {
			setError(e.message);
		}
	};

	const handleUpdate = async (id: string) => {
		if (!editName.trim()) return;
		try {
			const updated = await updateDeck(id, editName.trim());
			setDecks(prev => prev.map(d => (d.id === id ? updated : d)));
			setEditingId(null);
		} catch (e: any) {
			setError(e.message);
		}
	};

	const handleDelete = async () => {
		if (!deletingDeck) return;
		try {
			await deleteDeck(deletingDeck.id);
			setDecks(prev => prev.filter(d => d.id !== deletingDeck.id));
			setDeletingDeck(null);
		} catch (e: any) {
			setError(e.message);
		}
	};

	const handleSaveLimits = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const updated = await updateDailyLimits({
				maxNewCards: maxNew,
				maxReviews,
			});
			setLimits(updated);
			setEditingLimits(false);
		} catch (e: any) {
			setError(e.message);
		}
	};

	if (loading) return <LoadingSpinner />;
	if (error) return <ErrorMessage message={error} onRetry={load} />;

	const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0);
	const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);

	return (
		<div ref={container} className='space-y-6 md:space-y-10'>
			<div className='page-header opacity-0 -translate-y-4 flex flex-col md:flex-row md:items-end justify-between gap-6'>
				<div>
					<h1 className='text-3xl md:text-5xl font-bold text-(--color-text-primary) tracking-tight'>
						Let's start <span className='text-(--color-accent)'>strong!</span>
					</h1>
					<p className='text-sm md:text-base text-(--color-text-secondary) mt-2 font-medium'>
						Welcome back. Ready for your daily challenge?
					</p>
				</div>
				<button
					onClick={() => setShowCreate(true)}
					className='button-primary shadow-xl shadow-orange-500/20 py-3 md:py-2 whitespace-nowrap'
				>
					+ New Deck
				</button>
			</div>

			{showCreate && (
				<div className='create-form-gsap opacity-0 scale-95 premium-card p-4 md:p-6'>
					<h3 className='text-lg font-bold mb-4 heading'>Create New Deck</h3>
					<form
						onSubmit={handleCreate}
						className='flex flex-col md:flex-row gap-3'
					>
						<input
							autoFocus
							value={newName}
							onChange={e => setNewName(e.target.value)}
							placeholder='e.g. Spanish Vocabulary'
							className='flex-1 px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none'
						/>
						<div className='flex gap-2'>
							<button type='submit' className='button-primary flex-1 md:flex-none px-8 py-3 md:py-2'>
								Create
							</button>
							<button
								type='button'
								onClick={() => {
									setShowCreate(false);
									setNewName('');
								}}
								className='px-4 py-3 md:py-2 text-sm font-bold text-(--color-text-tertiary) hover:text-(--color-text-secondary) flex-1 md:flex-none'
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Today's progress Dashboard */}
			{limits && (
				<section>
					<div className='flex items-center justify-between mb-4 px-2'>
						<h2 className='text-xl font-bold text-(--color-text-primary) heading'>
							Your Daily Progress
						</h2>
						{!editingLimits && (
							<button
								onClick={() => setEditingLimits(true)}
								className='text-sm font-bold text-(--color-accent) hover:underline'
							>
								Edit Limits
							</button>
						)}
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='stat-card opacity-0 scale-95 premium-card p-6 flex flex-col justify-between min-h-32 bg-linear-to-br from-white to-orange-50/30 dark:from-white/5 dark:to-white/0'>
							<span className='text-xs font-bold uppercase tracking-wider text-(--color-text-muted)'>
								New today
							</span>
							<div className='mt-4 flex items-end gap-2'>
								<span className='text-3xl font-bold tracking-tighter'>
									{limits.todayNewCount}
								</span>
								<span className='text-sm text-(--color-text-muted) mb-1'>
									/ {limits.maxNewCards}
								</span>
							</div>
						</div>

						<div className='stat-card opacity-0 scale-95 premium-card p-6 flex flex-col justify-between min-h-32'>
							<span className='text-xs font-bold uppercase tracking-wider text-(--color-text-muted)'>
								Reviews today
							</span>
							<div className='mt-4 flex items-end gap-2'>
								<span className='text-3xl font-bold tracking-tighter'>
									{limits.todayReviewCount}
								</span>
								<span className='text-sm text-(--color-text-muted) mb-1'>
									/ {limits.maxReviews}
								</span>
							</div>
						</div>

						<div className='stat-card opacity-0 scale-95 premium-card p-6 flex flex-col justify-between min-h-32 border-l-4 border-l-(--color-accent)'>
							<span className='text-xs font-bold uppercase tracking-wider text-(--color-accent)'>
								Due now
							</span>
							<div className='mt-4'>
								<span className='text-4xl font-bold tracking-tighter text-(--color-accent)'>
									{totalDue}
								</span>
							</div>
						</div>

						<div className='stat-card opacity-0 scale-95 premium-card p-6 flex flex-col justify-between min-h-32'>
							<span className='text-xs font-bold uppercase tracking-wider text-(--color-text-muted)'>
								Total cards
							</span>
							<div className='mt-4 text-3xl font-bold tracking-tighter'>
								{totalCards}
							</div>
						</div>
					</div>

					{editingLimits && (
						<div className='limits-form-gsap opacity-0 scale-95 premium-card p-6 mt-6'>
							<form
								onSubmit={handleSaveLimits}
								className='flex items-end gap-6 flex-wrap'
							>
								<div className='space-y-2'>
									<label className='text-sm font-bold text-(--color-text-primary)'>
										Max New Cards
									</label>
									<input
										type='number'
										min={0}
										value={maxNew}
										onChange={e => setMaxNew(Number(e.target.value))}
										className='w-32 px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none'
									/>
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-bold text-(--color-text-primary)'>
										Max Reviews
									</label>
									<input
										type='number'
										min={0}
										value={maxReviews}
										onChange={e => setMaxReviews(Number(e.target.value))}
										className='w-32 px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none'
									/>
								</div>
								<div className='flex gap-3'>
									<button type='submit' className='button-primary py-2 px-6'>
										Save Changes
									</button>
									<button
										type='button'
										onClick={() => setEditingLimits(false)}
										className='px-6 py-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary)'
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					)}
				</section>
			)}


			{/* Decks Grid */}
			<section>
				<h2 className='text-xl font-bold text-(--color-text-primary) mb-6 px-2 heading'>
					Your Collections
				</h2>
				{decks.length === 0 ? (
					<EmptyState
						title='No collections yet'
						description='Start by creating your first deck of flashcards.'
						action={{
							label: 'Craft Your First Deck',
							onClick: () => setShowCreate(true),
						}}
					/>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{decks.map(deck => (
							<div
								key={deck.id}
								className='deck-card opacity-0 translate-y-8 premium-card p-6 group'
							>
								{editingId === deck.id ? (
									<form
										onSubmit={e => {
											e.preventDefault();
											handleUpdate(deck.id);
										}}
										className='flex-1 flex gap-2'
									>
										<input
											autoFocus
											value={editName}
											onChange={e => setEditName(e.target.value)}
											className='flex-1 px-4 py-2 bg-(--color-bg-page) border border-(--color-border) rounded-xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none'
										/>
										<button
											type='submit'
											className='text-sm font-bold text-(--color-accent) hover:underline'
										>
											Save
										</button>
										<button
											type='button'
											onClick={() => setEditingId(null)}
											className='text-sm font-bold text-(--color-text-muted)'
										>
											Cancel
										</button>
									</form>
								) : (
									<div className='flex items-start justify-between'>
										<Link to={`/decks/${deck.id}`} className='flex-1 min-w-0'>
											<h3 className='text-xl font-bold text-(--color-text-primary) group-hover:text-(--color-accent) transition-colors heading truncate'>
												{deck.name}
											</h3>
											<div className='mt-3 flex gap-4'>
												<div className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-(--color-text-secondary)'>
													<span className='w-2 h-2 rounded-full bg-blue-500'></span>
													{deck.cardCount} Cards
												</div>
												<div className='flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 dark:bg-(--color-accent-muted) rounded-lg text-xs font-bold text-(--color-accent)'>
													<span className='w-2 h-2 rounded-full bg-(--color-accent)'></span>
													{deck.dueCount} Due
												</div>
											</div>
										</Link>
										<div className='flex gap-4 ml-4 opacity-0 group-hover:opacity-100 transition-opacity'>
											<button
												onClick={() => {
													setEditingId(deck.id);
													setEditName(deck.name);
												}}
												className='p-2 text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-accent-muted) rounded-xl transition-all'
												title='Edit Deck'
											>
												<svg
													className='w-5 h-5'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth={2}
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'
													/>
												</svg>
											</button>
											<button
												onClick={() => setDeletingDeck(deck)}
												className='p-2 text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all'
												title='Delete Deck'
											>
												<svg
													className='w-5 h-5'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth={2}
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
													/>
												</svg>
											</button>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</section>

			{deletingDeck && (
				<ConfirmDialog
					title='Delete Deck'
					message={`Are you sure you want to delete "${deletingDeck.name}"? This will also delete all its cards.`}
					onConfirm={handleDelete}
					onCancel={() => setDeletingDeck(null)}
				/>
			)}
		</div>
	);
}
