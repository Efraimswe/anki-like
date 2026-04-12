import { useGSAP } from '@gsap/react';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import gsap from 'gsap';
import { updateProfile } from '@/entities/user';
import { useAuth } from '@/entities/session';

export default function UpdateProfileForm() {
	const { user, updateUser } = useAuth();
	const [displayName, setDisplayName] = useState(user?.displayName || '');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');
	const [isEditingName, setIsEditingName] = useState(false);

	useGSAP(
		() => {
			if (isEditingName) {
				gsap.to('.profile-save-wrapper', {
					height: 'auto',
					opacity: 1,
					duration: 0.5,
					ease: 'power3.out',
				});
				gsap.to('.profile-save-button', {
					scale: 1,
					opacity: 1,
					duration: 0.4,
					ease: 'back.out(1.7)',
				});
			} else {
				gsap.to('.profile-save-wrapper', {
					height: 0,
					opacity: 0,
					duration: 0.4,
					ease: 'power3.inOut',
				});
				gsap.to('.profile-save-button', {
					scale: 0.95,
					opacity: 0,
					duration: 0.3,
				});
			}
		},
		{ dependencies: [isEditingName] },
	);

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
		<div className='max-w-4xl space-y-6'>
			<div className='space-y-2'>
				<h2 className='text-3xl font-bold text-(--color-text-primary) heading'>
					Profile
				</h2>
				<p className='text-sm font-medium text-(--color-text-secondary)'>
					Manage your personal information and public presence.
				</p>
			</div>

			<div className='premium-card rounded-[2rem] p-6 md:p-8 shadow-xl'>
				<div className='flex flex-col gap-8 md:flex-row md:items-center'>
					<div className='flex justify-center md:justify-start'>
						<div className='relative'>
							<div className='h-24 w-24 rounded-full border-4 border-white bg-(--color-bg-page) shadow-lg dark:border-(--color-border)' />
							<button
								type='button'
								className='absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent) text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-105'
								aria-label='Edit avatar placeholder'
							>
								<Pencil className='h-4 w-4' strokeWidth={2.5} />
							</button>
						</div>
					</div>

					<div className='grid flex-1 gap-5 md:grid-cols-2'>
						<div className='space-y-2'>
							<label className='ml-1 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)'>
								Full name
							</label>
							<input
								value={displayName}
								onChange={e => setDisplayName(e.target.value)}
								onFocus={() => setIsEditingName(true)}
								onBlur={() => {
									window.setTimeout(() => setIsEditingName(false), 120);
								}}
								className='w-full rounded-xl border border-(--color-border) bg-white px-5 py-4 font-medium text-(--color-text-primary) outline-none transition-all focus:ring-2 focus:ring-(--color-accent-ring) dark:bg-(--color-bg-page)'
								placeholder='John Doe'
							/>
						</div>

						<div className='space-y-2'>
							<label className='ml-1 text-xs font-bold uppercase tracking-widest text-(--color-text-muted)'>
								Email address
							</label>
							<div className='w-full rounded-xl border border-(--color-border) bg-white px-5 py-4 font-medium text-(--color-text-secondary) dark:bg-(--color-bg-page)'>
								{user?.email || ''}
							</div>
						</div>
					</div>
				</div>

				<div className='mt-8 flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-end'>
					{message && (
						<p
							className={`text-sm font-bold ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'} animate-in fade-in slide-in-from-left-2`}
						>
							{message}
						</p>
					)}
					<div
						className='profile-save-wrapper overflow-hidden'
						style={{ height: 0, opacity: 0 }}
					>
						<button
							onClick={handleSave}
							disabled={saving}
							className='profile-save-button button-primary px-10 py-3 shadow-xl shadow-orange-500/10 opacity-0 scale-95'
						>
							{saving ? 'Saving...' : 'Update Profile'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
