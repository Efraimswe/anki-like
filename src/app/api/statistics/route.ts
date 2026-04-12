import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { getNow } from '@/lib/clock';
import type { TokenPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const period = request.nextUrl.searchParams.get('period') || 'week';
  const now = getNow();
  let from: Date;

  if (period === 'month') {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === 'all') {
    from = new Date(0);
  } else {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const logs = await prisma.reviewLog.findMany({
    where: {
      card: { deck: { userId: user.sub } },
      reviewedAt: { gte: from },
    },
    orderBy: { reviewedAt: 'asc' },
  });

  const totalReviews = logs.length;
  const correctReviews = logs.filter((l) => l.rating !== 0).length;
  const accuracyPercent = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
  const totalTimeMinutes = Math.round(logs.reduce((sum, l) => sum + (l.timeTakenMs || 0), 0) / 60000);

  // Retention: approximate from interval growth (cards where interval didn't decrease)
  const retainedReviews = logs.filter((l) => l.intervalAfter >= l.intervalBefore);
  const retentionRate = totalReviews > 0 ? Math.round((retainedReviews.length / totalReviews) * 100) : 0;

  // Daily breakdown
  const dailyMap = new Map<string, { reviews: number; timeMs: number; correct: number }>();
  for (const log of logs) {
    const date = log.reviewedAt.toISOString().split('T')[0];
    const entry = dailyMap.get(date) || { reviews: 0, timeMs: 0, correct: 0 };
    entry.reviews++;
    entry.timeMs += log.timeTakenMs || 0;
    if (log.rating !== 0) entry.correct++;
    dailyMap.set(date, entry);
  }

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, d]) => ({
    date,
    reviews: d.reviews,
    timeMinutes: Math.round(d.timeMs / 60000),
    accuracy: d.reviews > 0 ? Math.round((d.correct / d.reviews) * 100) : 0,
  }));

  return NextResponse.json({ retentionRate, totalReviews, accuracyPercent, totalTimeMinutes, dailyBreakdown });
}
