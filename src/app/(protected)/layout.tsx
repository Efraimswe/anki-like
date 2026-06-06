import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ensureUserRecord } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  await ensureUserRecord(userId);

  return <AppLayout>{children}</AppLayout>;
}
