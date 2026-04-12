import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { DailyLimitsService } from './application/daily-limits.service';
import { ReviewsService } from './application/reviews.service';
import { DailyLimitsRepository } from './domain/ports/daily-limits.repository';
import { ReviewsRepository } from './domain/ports/reviews.repository';
import { Sm2Service } from './domain/services/sm2.service';
import { ReviewsController } from './infrastructure/http/reviews.controller';
import { PrismaDailyLimitsRepository } from './infrastructure/persistence/prisma-daily-limits.repository';
import { PrismaReviewsRepository } from './infrastructure/persistence/prisma-reviews.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    Sm2Service,
    DailyLimitsService,
    PrismaDailyLimitsRepository,
    PrismaReviewsRepository,
    { provide: DailyLimitsRepository, useExisting: PrismaDailyLimitsRepository },
    { provide: ReviewsRepository, useExisting: PrismaReviewsRepository },
  ],
  exports: [ReviewsService, Sm2Service, DailyLimitsService],
})
export class ReviewsModule {}
