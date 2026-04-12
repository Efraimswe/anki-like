import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { DecksModule } from '../decks/decks.module';
import { CardsService } from './application/cards.service';
import { CardsRepository } from './domain/ports/cards.repository';
import { CardsController } from './infrastructure/http/cards.controller';
import { PrismaCardsRepository } from './infrastructure/persistence/prisma-cards.repository';

@Module({
  imports: [PrismaModule, DecksModule],
  controllers: [CardsController],
  providers: [
    CardsService,
    PrismaCardsRepository,
    { provide: CardsRepository, useExisting: PrismaCardsRepository },
  ],
  exports: [CardsService, CardsRepository],
})
export class CardsModule {}
