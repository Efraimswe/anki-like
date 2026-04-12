import { prisma } from './prisma';
import { getNow } from './clock';

function startOfUtcDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getLimits(userId: string) {
  const row = await prisma.dailyLimit.findUnique({ where: { userId } });
  return {
    maxNewCards: row?.maxNewCards ?? 20,
    maxReviews: row?.maxReviews ?? 200,
  };
}

export async function updateLimits(userId: string, maxNewCards?: number, maxReviews?: number) {
  return prisma.dailyLimit.upsert({
    where: { userId },
    create: { userId, maxNewCards: maxNewCards ?? 20, maxReviews: maxReviews ?? 200 },
    update: { maxNewCards: maxNewCards ?? undefined, maxReviews: maxReviews ?? undefined },
  });
}

export async function getCounters(userId: string) {
  const today = startOfUtcDay(getNow());
  const counter = await prisma.dailyCounter.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  return {
    todayNewCount: counter?.newCount ?? 0,
    todayReviewCount: counter?.reviewCount ?? 0,
  };
}

export async function getLimitsWithCounters(userId: string) {
  const limits = await getLimits(userId);
  const counters = await getCounters(userId);
  return { ...limits, ...counters };
}

export async function checkLimits(userId: string, isNewCard: boolean): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getLimits(userId);
  const counters = await getCounters(userId);

  if (counters.todayReviewCount >= limits.maxReviews) {
    return { allowed: false, reason: 'Daily review limit reached' };
  }
  if (isNewCard && counters.todayNewCount >= limits.maxNewCards) {
    return { allowed: false, reason: 'Daily new card limit reached' };
  }
  return { allowed: true };
}
