import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const sessions = await this.sessionsService.findByUser(req.user.userId);
    return {
      sessions: sessions.map((s) => ({
        ...s,
        isCurrent: s.id === req.user.sessionId,
      })),
    };
  }

  @Delete(':id')
  async revoke(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    if (id === req.user.sessionId) {
      throw new ForbiddenException('Cannot revoke current session');
    }

    const session = await this.sessionsService.findById(id);
    if (!session || session.userId !== req.user.userId) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionsService.delete(id);
    return { message: 'Session revoked' };
  }
}
