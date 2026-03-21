import { useEffect, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getSessions, revokeSession, type Session } from '../api/sessions';
import { updateProfile } from '../api/users';
import { useAuth } from '../hooks/useAuth';

type Tab = 'profile' | 'sessions';

export default function Settings() {
	const [activeTab, setActiveTab] = useState<Tab>('profile');
	const container = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const tl = gsap.timeline();

			tl.from('.settings-header', {
				y: 20,
				opacity: 0,
				duration: 0.6,
				ease: 'power2.out',
			})
				.from(
					'.settings-tabs',
					{
						y: 10,
						opacity: 0,
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
		{ scope: container, dependencies: [activeTab] },
	);

	return (
		<div ref={container} className='space-y-6 md:space-y-10'>
			<div className='settings-header'>
				<h1 className='text-3xl md:text-5xl font-bold text-(--color-text-primary) tracking-tight heading'>
					Settings
				</h1>
				<p className='text-sm md:text-base text-(--color-text-secondary) mt-2 font-medium'>
					Manage your profile and active sessions
				</p>
			</div>

			<div className='settings-tabs flex w-full md:w-fit gap-2 md:gap-4 p-1.5 bg-(--color-bg-page) border border-(--color-border) rounded-2xl'>
				{(['profile', 'sessions'] as Tab[]).map(tab => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
							activeTab === tab
								? 'bg-white dark:bg-white/10 text-(--color-text-primary) shadow-sm'
								: 'text-(--color-text-muted) hover:text-(--color-text-secondary)'
						}`}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				))}
			</div>

			<div className='settings-content opacity-0 translate-y-4'>
				{activeTab === 'profile' && <ProfileTab />}
				{activeTab === 'sessions' && <SessionsTab />}
			</div>
		</div>
	);
}

function ProfileTab() {
	const { user, updateUser } = useAuth();
	const [displayName, setDisplayName] = useState(user?.displayName || '');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	async function handleSave() {
		setSaving(true);
		setMessage('');
		try {
			const updated = await updateProfile({ displayName: displayName || null });
			updateUser(updated);
			setMessage('Profile updated successfully!');
		} catch {
			setMessage('Failed to update profile');
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className='premium-card p-6 md:p-10 max-w-2xl shadow-xl'>
			<h3 className='text-xl font-bold mb-8 heading'>Your Profile</h3>
			<div className='space-y-8'>
				<div className='space-y-2'>
					<label className='text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1'>
						Email address
					</label>
					<div className='w-full px-5 py-4 bg-(--color-bg-muted)/50 border border-(--color-border) rounded-2xl font-medium text-(--color-text-secondary) cursor-not-allowed'>
						{user?.email || ''}
					</div>
				</div>

				<div className='space-y-2'>
					<label className='text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1'>
						Display Name
					</label>
					<input
						value={displayName}
						onChange={e => setDisplayName(e.target.value)}
						className='w-full px-5 py-4 bg-(--color-bg-page) border border-(--color-border) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all'
						placeholder='John Doe'
					/>
				</div>

				<div className='flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 pt-4'>
					<button
						onClick={handleSave}
						disabled={saving}
						className='button-primary px-10 py-3 shadow-xl shadow-orange-500/10'
					>
						{saving ? 'Saving...' : 'Update Profile'}
					</button>
					{message && (
						<p
							className={`text-sm font-bold ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'} animate-in fade-in slide-in-from-left-2`}
						>
							{message}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function SessionsTab() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSessions()
			.then(res => setSessions(res.sessions))
			.finally(() => setLoading(false));
	}, []);

	async function handleRevoke(id: string) {
		try {
			await revokeSession(id);
			setSessions(prev => prev.filter(s => s.id !== id));
		} catch (e) {
			console.error('Failed to revoke session', e);
		}
	}

	if (loading)
		return (
			<div className='flex justify-center py-20'>
				<div className='w-8 h-8 border-4 border-(--color-accent) border-t-transparent rounded-full animate-spin'></div>
			</div>
		);

	return (
		<div className='space-y-6 max-w-2xl'>
			<h3 className='text-xl font-bold px-2 heading'>Active Access Tokens</h3>
			<div className='space-y-4'>
				{sessions.map(session => (
					<div
						key={session.id}
						className='premium-card p-6 flex items-center justify-between border-none shadow-lg'
					>
						<div className='flex items-center gap-5'>
							<div className='w-12 h-12 rounded-2xl bg-(--color-bg-page) flex items-center justify-center text-2xl'>
								{session.deviceInfo?.toLowerCase().includes('phone')
									? '📱'
									: '💻'}
							</div>
							<div>
								<p className='font-bold text-(--color-text-primary) flex items-center gap-3'>
									{session.deviceInfo || 'Authorized Device'}
									{session.isCurrent && (
										<span className='text-[10px] font-bold uppercase tracking-widest bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md'>
											Active Now
										</span>
									)}
								</p>
								<p className='text-xs font-bold text-(--color-text-muted) uppercase tracking-wider mt-1'>
									{session.ipAddress} &middot; Last active{' '}
									{new Date(session.lastActiveAt).toLocaleDateString()}
								</p>
							</div>
						</div>
						{!session.isCurrent && (
							<button
								onClick={() => handleRevoke(session.id)}
								className='px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all'
							>
								Terminate
							</button>
						)}
					</div>
				))}
				{sessions.length === 0 && (
					<div className='premium-card p-10 text-center text-(--color-text-muted) font-bold'>
						No active sessions found.
					</div>
				)}
			</div>
		</div>
	);
}
