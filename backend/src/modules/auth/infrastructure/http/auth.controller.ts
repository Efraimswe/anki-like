import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { TokenCookies } from '../../domain/ports/auth-token-manager';
import { AuthService } from '../../application/auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from '../security/public.decorator';

const isProduction = process.env.NODE_ENV === 'production';

function setCookies(reply: FastifyReply, cookies: TokenCookies) {
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

function clearCookies(reply: FastifyReply) {
  reply.clearCookie('access_token', { path: '/' });
  reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
  reply.clearCookie('csrf_token', { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(
    @Body() dto: SignUpDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? null;
    const { user, cookies } = await this.authService.signUp(
      dto.email,
      dto.password,
      userAgent,
      ip,
    );
    setCookies(res, cookies);
    return { user };
  }

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? null;
    const { user, cookies } = await this.authService.signIn(
      dto.email,
      dto.password,
      userAgent,
      ip,
    );
    setCookies(res, cookies);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = (req as any).cookies?.refresh_token;
    if (!refreshToken) {
      clearCookies(res);
      return { message: 'No refresh token' };
    }
    const { cookies } = await this.authService.refresh(refreshToken);
    setCookies(res, cookies);
    return { message: 'Token refreshed' };
  }

  @Post('sign-out')
  @HttpCode(200)
  async signOut(
    @Req() req: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.signOut(req.user.sessionId);
    clearCookies(res);
    return { message: 'Signed out' };
  }
}
