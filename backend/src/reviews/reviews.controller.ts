import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Req,
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
    @Req() req: any,
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getDueCards(
      req.user.userId,
      deckId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('reviews')
  submitReview(@Req() req: any, @Body() dto: SubmitReviewDto) {
    return this.reviewsService.submitReview(
      req.user.userId,
      dto.cardId,
      dto.rating,
      dto.timeTakenMs,
    );
  }

  @Get('settings/daily-limits')
  getDailyLimits(@Req() req: any) {
    return this.dailyLimitsService.getLimitsWithCounters(req.user.userId);
  }

  @Patch('settings/daily-limits')
  updateDailyLimits(@Req() req: any, @Body() dto: UpdateDailyLimitsDto) {
    return this.dailyLimitsService.updateLimits(req.user.userId, dto.maxNewCards, dto.maxReviews);
  }
}
