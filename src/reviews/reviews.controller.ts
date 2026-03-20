import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { DailyLimitsService } from './daily-limits.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { UpdateDailyLimitsDto } from './dto/update-daily-limits.dto';

@Controller()
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly dailyLimitsService: DailyLimitsService,
  ) {}

  @Get('decks/:deckId/reviews/due')
  getDueCards(
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getDueCards(
      deckId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('reviews')
  submitReview(@Body() dto: SubmitReviewDto) {
    return this.reviewsService.submitReview(
      dto.cardId,
      dto.rating,
      dto.timeTakenMs,
    );
  }

  @Get('settings/daily-limits')
  getDailyLimits() {
    return this.dailyLimitsService.getLimitsWithCounters();
  }

  @Patch('settings/daily-limits')
  updateDailyLimits(@Body() dto: UpdateDailyLimitsDto) {
    return this.dailyLimitsService.updateLimits(dto.maxNewCards, dto.maxReviews);
  }
}
