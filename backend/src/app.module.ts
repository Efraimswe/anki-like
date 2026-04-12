import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './shared/config/config.module';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { DecksModule } from './modules/decks/decks.module';
import { CardsModule } from './modules/cards/cards.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { JwtAuthGuard } from './modules/auth/infrastructure/security/jwt-auth.guard';
import { CsrfGuard } from './modules/auth/infrastructure/security/csrf.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    DecksModule,
    CardsModule,
    ReviewsModule,
    StatisticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
