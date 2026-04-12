import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/auth.service';
import { AuthController } from './infrastructure/http/auth.controller';
import { AuthTokenManager } from './domain/ports/auth-token-manager';
import { UserAgentParser } from './domain/ports/user-agent-parser';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { JwtTokenManagerService } from './infrastructure/security/jwt-token-manager.service';
import { UaParserService } from './infrastructure/security/ua-parser.service';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    UsersModule,
    SessionsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtTokenManagerService,
    UaParserService,
    { provide: AuthTokenManager, useExisting: JwtTokenManagerService },
    { provide: UserAgentParser, useExisting: UaParserService },
  ],
  exports: [AuthService],
})
export class AuthModule {}
