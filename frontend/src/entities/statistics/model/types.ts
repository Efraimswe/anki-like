export interface DailyStat {
  date: string;
  reviews: number;
  timeMinutes: number;
  accuracy: number;
}

export interface Statistics {
  retentionRate: number;
  totalReviews: number;
  accuracyPercent: number;
  totalTimeMinutes: number;
  dailyBreakdown: DailyStat[];
}

export interface DailyLimits {
  maxNewCards: number;
  maxReviews: number;
  todayNewCount: number;
  todayReviewCount: number;
}
