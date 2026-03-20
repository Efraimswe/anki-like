import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLimits() {
    const row = await this.prisma.dailyLimit.findFirst();
    return {
      maxNewCards: row?.maxNewCards ?? 20,
      maxReviews: row?.maxReviews ?? 200,
    };
  }

  async updateLimits(maxNewCards?: number, maxReviews?: number) {
    const existing = await this.prisma.dailyLimit.findFirst();
    if (!existing) return null;

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

  async getCounters() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const row = await this.prisma.dailyCounter.findUnique({
      where: { date: today },
    });
    return {
      todayNewCount: row?.newCount ?? 0,
      todayReviewCount: row?.reviewCount ?? 0,
    };
  }

  async getLimitsWithCounters() {
    const limits = await this.getLimits();
    const counters = await this.getCounters();
    return { ...limits, ...counters };
  }

  async checkLimits(isNewCard: boolean): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getLimits();
    const counters = await this.getCounters();

    if (counters.todayReviewCount >= limits.maxReviews) {
      return { allowed: false, reason: 'Daily review limit reached' };
    }

    if (isNewCard && counters.todayNewCount >= limits.maxNewCards) {
      return { allowed: false, reason: 'Daily new card limit reached' };
    }

    return { allowed: true };
  }
}
