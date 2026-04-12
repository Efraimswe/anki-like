import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/persistence/prisma/prisma.module';
import { UsersService } from './application/users.service';
import { UsersRepository } from './domain/ports/users.repository';
import { UsersController } from './infrastructure/http/users.controller';
import { PrismaUsersRepository } from './infrastructure/persistence/prisma-users.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaUsersRepository,
    { provide: UsersRepository, useExisting: PrismaUsersRepository },
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
