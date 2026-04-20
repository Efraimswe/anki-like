import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect('/sign-in');
  redirect('/onboarding/step-1');
}
