import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { DecksModule } from './decks/decks.module';
import { CardsModule } from './cards/cards.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    DecksModule,
    CardsModule,
    ReviewsModule,
    StatisticsModule,
  ],
})
export class AppModule {}
