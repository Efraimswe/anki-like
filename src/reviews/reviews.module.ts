import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Sm2Service } from './sm2.service';
import { DailyLimitsService } from './daily-limits.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, Sm2Service, DailyLimitsService],
  exports: [ReviewsService, Sm2Service, DailyLimitsService],
})
export class ReviewsModule {}
