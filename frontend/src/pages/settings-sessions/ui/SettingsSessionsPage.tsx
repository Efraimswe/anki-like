import { Link } from 'react-router-dom';
import { ManageSessions } from '@/features/session/manage-sessions';

export default function SettingsSessionsPage() {
	return (
		<div className='space-y-4'>
			<Link
				to='/settings'
				className='inline-flex items-center gap-2 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) lg:hidden'
			>
				<svg
					className='h-4 w-4'
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					strokeWidth={2}
				>
					<path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' />
				</svg>
				Back to settings
			</Link>
			<ManageSessions />
		</div>
	);
}
