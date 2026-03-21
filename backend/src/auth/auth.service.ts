import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as UAParser from 'ua-parser-js';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';

interface TokenCookies {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(email: string, password: string, userAgent: string | null, ip: string | null) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Unable to create account');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create(email, passwordHash);

    const deviceInfo = this.parseUserAgent(userAgent);
    const { session, rawToken } = await this.sessionsService.create(user.id, deviceInfo, ip);

    const cookies = this.generateTokens(user.id, session.id, rawToken);
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

    const deviceInfo = this.parseUserAgent(userAgent);
    const { session, rawToken } = await this.sessionsService.create(user.id, deviceInfo, ip);

    const cookies = this.generateTokens(user.id, session.id, rawToken);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, cookies, sessionId: session.id };
  }

  async refresh(refreshToken: string) {
    const session = await this.sessionsService.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRawToken = await this.sessionsService.rotateRefreshToken(session.id);
    const cookies = this.generateTokens(session.userId, session.id, newRawToken);
    return { cookies };
  }

  async signOut(sessionId: string) {
    try {
      await this.sessionsService.delete(sessionId);
    } catch {
      // Session may already be deleted
    }
  }

  private generateTokens(userId: string, sessionId: string, refreshToken: string): TokenCookies {
    const accessToken = this.jwtService.sign(
      { sub: userId, sid: sessionId },
      { expiresIn: '15m' },
    );
    const csrfToken = require('crypto').randomUUID();

    return { accessToken, refreshToken, csrfToken };
  }

  private parseUserAgent(userAgent: string | null): string | null {
    if (!userAgent) return null;
    const parser = new UAParser.UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const parts = [browser.name, browser.version ? `${browser.version}` : null, os.name ? `on ${os.name}` : null]
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : userAgent.substring(0, 100);
  }

  setCookies(
    reply: any,
    cookies: TokenCookies,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    reply.setCookie('access_token', cookies.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    reply.setCookie('refresh_token', cookies.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60,
    });

    reply.setCookie('csrf_token', cookies.csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  clearCookies(reply: any) {
    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
    reply.clearCookie('csrf_token', { path: '/' });
  }
}
