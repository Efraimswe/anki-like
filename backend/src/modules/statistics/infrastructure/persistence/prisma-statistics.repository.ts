import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { StatisticsRepository } from '../../domain/ports/statistics.repository';

@Injectable()
export class PrismaStatisticsRepository implements StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findReviewLogs(userId: string, from?: string, to?: string) {
    const where: {
      card: { deck: { userId: string } };
      reviewedAt?: { gte?: Date; lte?: Date };
    } = { card: { deck: { userId } } };

    if (from || to) {
      where.reviewedAt = {};
      if (from) where.reviewedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        where.reviewedAt.lte = toDate;
      }
    }

    return this.prisma.reviewLog.findMany({ where });
  }
}
