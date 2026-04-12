import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { AuthTokenManager, TokenCookies } from '../../domain/ports/auth-token-manager';

@Injectable()
export class JwtTokenManagerService implements AuthTokenManager {
  constructor(private readonly jwtService: JwtService) {}

  issueTokens(userId: string, sessionId: string, refreshToken: string): TokenCookies {
    const accessToken = this.jwtService.sign(
      { sub: userId, sid: sessionId },
      { expiresIn: '15m' },
    );

    return {
      accessToken,
      refreshToken,
      csrfToken: randomUUID(),
    };
  }
}
