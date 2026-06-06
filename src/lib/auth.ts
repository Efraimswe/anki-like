import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export interface TokenPayload {
  sub: string;
}

export async function ensureUserRecord(clerkUserId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });
  if (existing) return;

  const cu = await currentUser();
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? `${clerkUserId}@unknown.clerk`;
  const displayName = cu?.fullName ?? cu?.firstName ?? null;

  await prisma.user.create({
    data: { id: clerkUserId, email, displayName },
  });
}

export async function getAuthUser(): Promise<TokenPayload | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return { sub: userId };
}
