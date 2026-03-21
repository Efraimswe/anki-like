import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const data: { displayName?: string } = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName ?? undefined as any;
    return this.usersService.update(req.user.userId, data);
  }
}
