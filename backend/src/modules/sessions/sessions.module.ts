import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { SessionsService } from './application/sessions.service';
import { SessionsRepository } from './domain/ports/sessions.repository';
import { SessionsController } from './infrastructure/http/sessions.controller';
import { PrismaSessionsRepository } from './infrastructure/persistence/prisma-sessions.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    PrismaSessionsRepository,
    { provide: SessionsRepository, useExisting: PrismaSessionsRepository },
  ],
  exports: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
