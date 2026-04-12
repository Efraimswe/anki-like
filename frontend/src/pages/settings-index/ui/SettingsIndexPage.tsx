import { ChevronRight, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const settingsLinks = [
	{
		to: '/settings/profile',
		label: 'Profile',
		description: 'Update your display name and account details',
		Icon: UserRound,
	},
	{
		to: '/settings/sessions',
		label: 'Sessions',
		description: 'Review active devices and revoke access',
		Icon: ShieldCheck,
	},
];

export default function SettingsIndex() {
	return (
		<div className='space-y-4 max-w-2xl'>
			{settingsLinks.map(link => (
				<Link
					key={link.to}
					to={link.to}
					className='group flex w-full items-center gap-4 rounded-[2rem] border border-(--color-border) bg-(--color-bg-surface) px-5 py-4 transition-all hover:border-(--color-border-strong) hover:bg-(--color-bg-surface-hover)'
				>
					<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--color-accent) text-white shadow-[0_14px_28px_-16px_rgba(242,91,57,0.55)] transition-shadow group-hover:shadow-[0_18px_34px_-16px_rgba(242,91,57,0.62)] dark:text-(--color-bg-page)'>
						<link.Icon className='h-5 w-5' strokeWidth={2} />
					</div>
					<div className='min-w-0 flex-1 text-left'>
						<p className='text-sm font-bold text-(--color-text-primary)'>
							{link.label}
						</p>
						<p className='mt-1 text-xs font-medium text-(--color-text-tertiary)'>
							{link.description}
						</p>
					</div>
					<ChevronRight className='h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5' />
				</Link>
			))}
		</div>
	);
}
