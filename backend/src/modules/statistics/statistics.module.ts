import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { StatisticsService } from './application/statistics.service';
import { StatisticsRepository } from './domain/ports/statistics.repository';
import { StatisticsController } from './infrastructure/http/statistics.controller';
import { PrismaStatisticsRepository } from './infrastructure/persistence/prisma-statistics.repository';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    PrismaStatisticsRepository,
    { provide: StatisticsRepository, useExisting: PrismaStatisticsRepository },
  ],
})
export class StatisticsModule {}
