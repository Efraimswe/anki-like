import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { DecksService } from '../../application/decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDeckDto) {
    return this.decksService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.decksService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.decksService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.decksService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.decksService.remove(req.user.userId, id);
  }
}
