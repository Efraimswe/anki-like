import { useEffect, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface CardWithDeck {
	id: string;
	deckId: string;
	front: string;
	back: string;
	type: string;
	tags: string[];
	createdAt: string;
	deck: { id: string; name: string };
}

export default function AllCards() {
	const [cards, setCards] = useState<CardWithDeck[]>([]);
	const [loading, setLoading] = useState(true);
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		api
			.get<CardWithDeck[]>('/cards')
			.then(setCards)
			.finally(() => setLoading(false));
	}, []);

	useGSAP(
		() => {
			if (loading) return;

			gsap.to('.header-gsap', {
				y: 0,
				opacity: 1,
				duration: 0.6,
				ease: 'power2.out',
			});

			gsap.to('.card-gsap', {
				y: 0,
				opacity: 1,
				duration: 0.5,
				stagger: 0.05,
				ease: 'power2.out',
			});
		},
		{ scope: container, dependencies: [loading] },
	);

	if (loading)
		return (
			<div className='flex justify-center py-20'>
				<div className='w-8 h-8 border-4 border-(--color-accent) border-t-transparent rounded-full animate-spin'></div>
			</div>
		);

	return (
		<div ref={container} className='space-y-10'>
			<div className='header-gsap opacity-0 -translate-y-4'>
				<h2 className='text-5xl font-bold text-(--color-text-primary) tracking-tight heading'>
					Global Stack
				</h2>
				<p className='text-(--color-text-secondary) mt-2 font-medium'>
					Browse every card across all your memory decks
				</p>
			</div>

			{cards.length === 0 ? (
				<div className='premium-card p-16 text-center border-dashed border-2'>
					<p className='text-(--color-text-tertiary) font-medium'>
						No cards discovered yet. Start by creating your first deck!
					</p>
					<Link
						to='/decks'
						className='button-primary inline-block mt-8 shadow-xl shadow-orange-500/10'
					>
						Browse Decks
					</Link>
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{cards.map(card => (
						<div
							key={card.id}
							className='card-gsap opacity-0 translate-y-4 premium-card p-6 group hover:border-(--color-accent)/30'
						>
							<div className='flex items-start justify-between gap-4'>
								<div className='flex-1 min-w-0'>
									<p className='text-lg font-bold text-(--color-text-primary) truncate leading-tight group-hover:text-(--color-accent) transition-colors'>
										{card.front}
									</p>
									<p className='text-sm font-medium text-(--color-text-tertiary) mt-1 truncate'>
										{card.back}
									</p>
									<div className='flex items-center gap-3 mt-4'>
										<span className='text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) bg-(--color-bg-page) px-2 py-0.5 rounded-md border border-(--color-border)'>
											{card.type}
										</span>
										<Link
											to={`/decks/${card.deck.id}`}
											className='text-[10px] font-bold uppercase tracking-widest text-(--color-accent) hover:underline'
										>
											{card.deck.name}
										</Link>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
