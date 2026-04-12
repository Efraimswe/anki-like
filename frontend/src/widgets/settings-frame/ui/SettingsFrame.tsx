import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function SettingsFrame() {
	const container = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const isSettingsIndex = location.pathname === '/settings';

	useGSAP(
		() => {
			const tl = gsap.timeline();

			tl.to('.settings-header', {
				y: 0,
				opacity: 1,
				duration: 0.6,
				ease: 'power2.out',
			})
				.to(
					'.settings-tabs',
					{
						y: 0,
						opacity: 1,
						duration: 0.5,
						ease: 'power2.out',
					},
					'-=0.3',
				)
				.to(
					'.settings-content',
					{
						y: 0,
						opacity: 1,
						duration: 0.6,
						ease: 'power2.out',
					},
					'-=0.3',
				);
		},
		{ scope: container },
	);

	return (
		<div ref={container} className='space-y-4 md:space-y-6 lg:space-y-10'>
			{isSettingsIndex && (
				<div className='settings-header opacity-0 -translate-y-4 hidden lg:block'>
					<h1 className='text-3xl md:text-5xl font-bold text-(--color-text-primary) tracking-tight heading'>
						Settings
					</h1>
					<p className='text-sm md:text-base text-(--color-text-secondary) mt-2 font-medium'>
						Manage your profile and active sessions
					</p>
				</div>
			)}

			<div className='settings-content opacity-0 -translate-y-4'>
				<Outlet />
			</div>
		</div>
	);
}
