import { useState, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const navItems = [
	{
		to: '/decks',
		label: 'Decks',
		icon: (
			<svg
				className='w-5 h-5'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				strokeWidth={1.5}
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					d='M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0 4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0 4.179 2.25L12 22.5l-9.75-5.25 4.179-2.25'
				/>
			</svg>
		),
	},
	{
		to: '/cards',
		label: 'Cards',
		icon: (
			<svg
				className='w-5 h-5'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				strokeWidth={1.5}
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					d='M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z'
				/>
			</svg>
		),
	},
	{
		to: '/settings',
		label: 'Settings',
		icon: (
			<svg
				className='w-5 h-5'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				strokeWidth={1.5}
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z'
				/>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
				/>
			</svg>
		),
	},
];

export default function Layout() {
	const { user, signOut } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const [collapsed, setCollapsed] = useState(
		() => localStorage.getItem('sidebar-collapsed') === 'true',
	);
	const container = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			// Sidebar entrance
			gsap.to('.sidebar-island', {
				x: 0,
				opacity: 1,
				duration: 0.8,
				ease: 'power3.out',
			});

			// Nav items staggered
			gsap.to('.nav-item-gsap', {
				x: 0,
				opacity: 1,
				duration: 0.5,
				stagger: 0.08,
				delay: 0.4,
				ease: 'power2.out',
			});

			// Main Outlet entrance
			gsap.to('.outlet-gsap', {
				y: 0,
				opacity: 1,
				duration: 0.8,
				delay: 0.2,
				ease: 'power2.out',
			});
		},
		{ scope: container },
	);

	const toggle = () => {
		setCollapsed(prev => {
			localStorage.setItem('sidebar-collapsed', String(!prev));
			return !prev;
		});
	};

	return (
		<div
			ref={container}
			className='min-h-screen flex flex-col lg:flex-row bg-(--color-bg-page) text-(--color-text-primary) p-4 md:p-6 lg:gap-6'
		>
			{/* Mobile Header */}
			<header className='lg:hidden flex items-center justify-between py-2 px-1 mb-4'>
				<div className='flex items-center gap-3'>
					<div className='w-8 h-8 rounded-lg bg-gradient-to-tr from-(--color-accent) to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-lg'>
						{(user?.displayName || user?.email || '?')[0].toUpperCase()}
					</div>
					<span className='text-xl font-bold text-(--color-text-primary) heading truncate'>
						Anki-Like
					</span>
				</div>
				<button
					onClick={toggleTheme}
					className='p-2.5 rounded-xl bg-white/5 border border-white/10 text-(--color-text-secondary) hover:text-white transition-all'
				>
					{theme === 'dark' ? (
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
								d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
							/>
						</svg>
					) : (
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
								d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
							/>
						</svg>
					)}
				</button>
			</header>

			{/* Sidebar: Floating Island (Desktop Only) */}
			<aside
				className={`sidebar-island opacity-0 -translate-x-24 fixed top-6 bottom-6 left-6 z-30 hidden lg:flex flex-col sidebar-glass shadow-2xl overflow-hidden ${
					collapsed ? 'w-20' : 'w-64'
				}`}
				style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
			>
				{/* Logo + toggle */}
				<div
					className={`flex items-center justify-between h-20 px-6 ${collapsed ? 'flex-col gap-4 py-6' : ''}`}
				>
					{!collapsed && (
						<span className='text-xl font-bold text-white heading truncate'>
							Anki-Like
						</span>
					)}
					<button
						onClick={toggle}
						className={`p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all ${
							collapsed ? '' : ''
						}`}
						title={collapsed ? 'Expand' : 'Collapse'}
					>
						<svg
							className='w-6 h-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth={2}
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
							/>
						</svg>
					</button>
				</div>

				{/* Nav items */}
				<nav className='flex-1 py-4 px-3 space-y-2 overflow-y-auto overflow-x-hidden'>
					{navItems.map(item => (
						<NavLink
							key={item.to}
							to={item.to}
							viewTransition
							title={collapsed ? item.label : undefined}
							className={({ isActive }) =>
								`nav-item-gsap flex items-center gap-4 rounded-2xl ${
									collapsed ? 'justify-center p-3' : 'px-4 py-3'
								} ${
									isActive
										? 'bg-white/15 text-white shadow-lg'
										: 'text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200'
								}`
							}
						>
							<span className='shrink-0'>{item.icon}</span>
							{!collapsed && (
								<span className='text-sm font-semibold tracking-wide whitespace-nowrap'>
									{item.label}
								</span>
							)}
						</NavLink>
					))}
				</nav>

				{/* Bottom: theme toggle + user */}
				<div className='p-4 space-y-3'>
					{/* Theme toggle */}
					<button
						onClick={toggleTheme}
						className={`flex items-center gap-4 w-full rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all ${
							collapsed ? 'justify-center p-3' : 'px-4 py-3'
						}`}
					>
						{theme === 'dark' ? (
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
									d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
								/>
							</svg>
						) : (
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
									d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
								/>
							</svg>
						)}
						{!collapsed && (
							<span className='text-sm font-semibold whitespace-nowrap'>
								{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
							</span>
						)}
					</button>

					{/* User Section */}
					<div
						className={`flex items-center rounded-2xl bg-white/5 p-3 ${
							collapsed ? 'justify-center' : 'gap-3'
						}`}
					>
						<div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-(--color-accent) to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-lg'>
							{(user?.displayName || user?.email || '?')[0].toUpperCase()}
						</div>
						{!collapsed && (
							<div className='flex-1 min-w-0'>
								<p className='text-xs font-bold text-white truncate whitespace-nowrap'>
									{user?.displayName || user?.email}
								</p>
								<button
									onClick={signOut}
									className='text-[10px] uppercase font-bold text-white/40 hover:text-(--color-accent) transition-colors mt-0.5 whitespace-nowrap'
								>
									Sign Out
								</button>
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* Main content */}
			<main
				className={`flex-1 transition-all duration-300 ${
					collapsed ? 'lg:ml-24' : 'lg:ml-68'
				} ml-0 mb-20 lg:mb-0`}
			>
				<div className='outlet-gsap opacity-0 translate-y-4 max-w-6xl mx-auto py-4'>
					<Outlet />
				</div>
			</main>

			{/* Mobile Bottom Navigation */}
			<nav className='lg:hidden fixed bottom-6 left-6 right-6 z-40 sidebar-glass flex items-center justify-around p-3 shadow-2xl rounded-3xl animate-in fade-in slide-in-from-bottom-10 backdrop-blur-xl border border-white/10'>
				{navItems.map(item => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							`flex flex-col items-center p-2 rounded-xl transition-all ${
								isActive
									? 'text-(--color-accent)'
									: 'text-(--color-text-muted) hover:text-(--color-text-secondary)'
							}`
						}
					>
						<span className='scale-110'>{item.icon}</span>
						<span className='text-[9px] font-bold mt-1 uppercase tracking-widest'>
							{item.label}
						</span>
					</NavLink>
				))}
				<button
					onClick={signOut}
					className='flex flex-col items-center p-2 rounded-xl text-(--color-text-muted) hover:text-red-400'
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
							d='M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75'
						/>
					</svg>
					<span className='text-[9px] font-bold mt-1 uppercase tracking-widest'>
						Exit
					</span>
				</button>
			</nav>
		</div>
	);
}
