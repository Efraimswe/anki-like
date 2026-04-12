export interface ReviewLogEntry {
  rating: number;
  timeTakenMs: number | null;
  reviewedAt: Date;
}

export abstract class StatisticsRepository {
  abstract findReviewLogs(userId: string, from?: string, to?: string): Promise<ReviewLogEntry[]>;
}
