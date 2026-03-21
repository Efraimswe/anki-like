import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from './public.decorator';

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
    this.authService.setCookies(res, cookies);
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
    this.authService.setCookies(res, cookies);
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
      this.authService.clearCookies(res);
      return { message: 'No refresh token' };
    }
    const { cookies } = await this.authService.refresh(refreshToken);
    this.authService.setCookies(res, cookies);
    return { message: 'Token refreshed' };
  }

  @Post('sign-out')
  @HttpCode(200)
  async signOut(
    @Req() req: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.signOut(req.user.sessionId);
    this.authService.clearCookies(res);
    return { message: 'Signed out' };
  }
}
