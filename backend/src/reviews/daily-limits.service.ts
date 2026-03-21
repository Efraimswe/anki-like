import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLimits(userId: string) {
    const row = await this.prisma.dailyLimit.findFirst({ where: { userId } });
    return {
      maxNewCards: row?.maxNewCards ?? 20,
      maxReviews: row?.maxReviews ?? 200,
    };
  }

  async updateLimits(userId: string, maxNewCards?: number, maxReviews?: number) {
    const existing = await this.prisma.dailyLimit.findFirst({ where: { userId } });
    if (!existing) {
      return this.prisma.dailyLimit.create({
        data: { userId, maxNewCards: maxNewCards ?? 20, maxReviews: maxReviews ?? 200 },
        select: { maxNewCards: true, maxReviews: true },
      });
    }

    const updated = await this.prisma.dailyLimit.update({
      where: { id: existing.id },
      data: {
        maxNewCards: maxNewCards ?? undefined,
        maxReviews: maxReviews ?? undefined,
        updatedAt: new Date(),
      },
    });
    return { maxNewCards: updated.maxNewCards, maxReviews: updated.maxReviews };
  }

  async getCounters(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const row = await this.prisma.dailyCounter.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    return {
      todayNewCount: row?.newCount ?? 0,
      todayReviewCount: row?.reviewCount ?? 0,
    };
  }

  async getLimitsWithCounters(userId: string) {
    const limits = await this.getLimits(userId);
    const counters = await this.getCounters(userId);
    return { ...limits, ...counters };
  }

  async checkLimits(userId: string, isNewCard: boolean): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getLimits(userId);
    const counters = await this.getCounters(userId);

    if (counters.todayReviewCount >= limits.maxReviews) {
      return { allowed: false, reason: 'Daily review limit reached' };
    }

    if (isNewCard && counters.todayNewCount >= limits.maxNewCards) {
      return { allowed: false, reason: 'Daily new card limit reached' };
    }

    return { allowed: true };
  }
}
