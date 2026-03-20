import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.reviewedAt = {};
      if (from) where.reviewedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        where.reviewedAt.lte = toDate;
      }
    }

    const logs = await this.prisma.reviewLog.findMany({ where });

    const totalReviews = logs.length;
    const correctReviews = logs.filter((l) => l.rating >= 3).length;
    const totalTimeMs = logs.reduce((sum, l) => sum + (l.timeTakenMs || 0), 0);

    const retentionRate =
      totalReviews > 0
        ? Math.round((correctReviews / totalReviews) * 1000) / 10
        : 0;
    const accuracyPercent = retentionRate;
    const totalTimeMinutes = Math.round(totalTimeMs / 60000);

    // Daily breakdown
    const dailyMap = new Map<string, { reviews: number; timeMs: number; correct: number }>();
    for (const log of logs) {
      const dateKey = log.reviewedAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey) || { reviews: 0, timeMs: 0, correct: 0 };
      entry.reviews++;
      entry.timeMs += log.timeTakenMs || 0;
      if (log.rating >= 3) entry.correct++;
      dailyMap.set(dateKey, entry);
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, d]) => ({
        date,
        reviews: d.reviews,
        timeMinutes: Math.round(d.timeMs / 60000),
        accuracy: d.reviews > 0 ? Math.round((d.correct / d.reviews) * 1000) / 10 : 0,
      }));

    return {
      retentionRate,
      totalReviews,
      accuracyPercent,
      totalTimeMinutes,
      dailyBreakdown,
    };
  }
}
