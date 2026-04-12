import { useEffect, useState } from 'react';
import { getSessions, revokeSession, type Session } from '@/entities/session';
import LoadingSpinner from '@/shared/ui/loading-spinner';

export default function ManageSessions() {
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

	if (loading) {
		return <LoadingSpinner />;
	}

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
								{session.deviceInfo?.toLowerCase().includes('phone') ? '📱' : '💻'}
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
