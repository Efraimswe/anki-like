export interface DailyLimits {
  maxNewCards: number;
  maxReviews: number;
}

export interface DailyCounters {
  todayNewCount: number;
  todayReviewCount: number;
}

export abstract class DailyLimitsRepository {
  abstract findLimits(userId: string): Promise<DailyLimits | null>;
  abstract saveLimits(userId: string, input: DailyLimits): Promise<DailyLimits>;
  abstract findCounters(userId: string, date: Date): Promise<DailyCounters>;
  abstract incrementCounters(userId: string, date: Date, isNewCard: boolean): Promise<void>;
}
