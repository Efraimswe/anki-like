import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getStatistics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statisticsService.getStatistics(from, to);
  }
}
