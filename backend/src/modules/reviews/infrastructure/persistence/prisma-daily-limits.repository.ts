import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { DailyLimitsRepository } from '../../domain/ports/daily-limits.repository';

@Injectable()
export class PrismaDailyLimitsRepository implements DailyLimitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLimits(userId: string) {
    const row = await this.prisma.dailyLimit.findFirst({ where: { userId } });

    if (!row) {
      return null;
    }

    return {
      maxNewCards: row.maxNewCards,
      maxReviews: row.maxReviews,
    };
  }

  async saveLimits(userId: string, input: { maxNewCards: number; maxReviews: number }) {
    const existing = await this.prisma.dailyLimit.findFirst({ where: { userId } });

    if (!existing) {
      const created = await this.prisma.dailyLimit.create({
        data: { userId, maxNewCards: input.maxNewCards, maxReviews: input.maxReviews },
        select: { maxNewCards: true, maxReviews: true },
      });

      return created;
    }

    const updated = await this.prisma.dailyLimit.update({
      where: { id: existing.id },
      data: {
        maxNewCards: input.maxNewCards,
        maxReviews: input.maxReviews,
        updatedAt: new Date(),
      },
      select: { maxNewCards: true, maxReviews: true },
    });

    return updated;
  }

  async findCounters(userId: string, date: Date) {
    const row = await this.prisma.dailyCounter.findUnique({
      where: { userId_date: { userId, date } },
    });

    return {
      todayNewCount: row?.newCount ?? 0,
      todayReviewCount: row?.reviewCount ?? 0,
    };
  }

  async incrementCounters(userId: string, date: Date, isNewCard: boolean) {
    await this.prisma.dailyCounter.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, newCount: isNewCard ? 1 : 0, reviewCount: 1 },
      update: { newCount: { increment: isNewCard ? 1 : 0 }, reviewCount: { increment: 1 } },
    });
  }
}
