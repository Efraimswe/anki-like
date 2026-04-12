import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { DecksService } from './application/decks.service';
import { DecksRepository } from './domain/ports/decks.repository';
import { DecksController } from './infrastructure/http/decks.controller';
import { PrismaDecksRepository } from './infrastructure/persistence/prisma-decks.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DecksController],
  providers: [
    DecksService,
    PrismaDecksRepository,
    { provide: DecksRepository, useExisting: PrismaDecksRepository },
  ],
  exports: [DecksService, DecksRepository],
})
export class DecksModule {}
