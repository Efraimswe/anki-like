import { Injectable } from '@nestjs/common';
import { DailyLimitsRepository } from '../domain/ports/daily-limits.repository';

@Injectable()
export class DailyLimitsService {
  constructor(private readonly dailyLimitsRepository: DailyLimitsRepository) {}

  async getLimits(userId: string) {
    const row = await this.dailyLimitsRepository.findLimits(userId);
    return {
      maxNewCards: row?.maxNewCards ?? 20,
      maxReviews: row?.maxReviews ?? 200,
    };
  }

  async updateLimits(userId: string, maxNewCards?: number, maxReviews?: number) {
    return this.dailyLimitsRepository.saveLimits(userId, {
      maxNewCards: maxNewCards ?? 20,
      maxReviews: maxReviews ?? 200,
    });
  }

  async getCounters(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.dailyLimitsRepository.findCounters(userId, today);
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
