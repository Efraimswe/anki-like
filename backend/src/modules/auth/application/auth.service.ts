import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SessionsService } from '../../sessions/application/sessions.service';
import { UsersService } from '../../users/application/users.service';
import { AuthTokenManager, TokenCookies } from '../domain/ports/auth-token-manager';
import { UserAgentParser } from '../domain/ports/user-agent-parser';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly authTokenManager: AuthTokenManager,
    private readonly userAgentParser: UserAgentParser,
  ) {}

  async signUp(email: string, password: string, userAgent: string | null, ip: string | null) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Unable to create account');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create(email, passwordHash);

    const deviceInfo = this.userAgentParser.parse(userAgent);
    const { session, rawToken } = await this.sessionsService.create(user.id, deviceInfo, ip);

    const cookies = this.authTokenManager.issueTokens(user.id, session.id, rawToken);
    return { user, cookies, sessionId: session.id };
  }

  async signIn(email: string, password: string, userAgent: string | null, ip: string | null) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const deviceInfo = this.userAgentParser.parse(userAgent);
    const { session, rawToken } = await this.sessionsService.create(user.id, deviceInfo, ip);

    const cookies = this.authTokenManager.issueTokens(user.id, session.id, rawToken);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, cookies, sessionId: session.id };
  }

  async refresh(refreshToken: string) {
    const session = await this.sessionsService.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRawToken = await this.sessionsService.rotateRefreshToken(session.id);
    const cookies = this.authTokenManager.issueTokens(session.userId, session.id, newRawToken);
    return { cookies };
  }

  async signOut(sessionId: string) {
    try {
      await this.sessionsService.delete(sessionId);
    } catch {
      // Session may already be deleted
    }
  }

}
