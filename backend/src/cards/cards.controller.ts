import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('decks/:deckId/cards')
  create(
    @Req() req: any,
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(req.user.userId, deckId, dto);
  }

  @Get('decks/:deckId/cards')
  findByDeck(
    @Req() req: any,
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cardsService.findByDeck(req.user.userId, deckId, {
      tag,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('cards')
  findAll(@Req() req: any, @Query('tag') tag?: string) {
    if (tag) {
      return this.cardsService.findByTag(req.user.userId, tag);
    }
    return this.cardsService.findAllForUser(req.user.userId);
  }

  @Get('cards/:id')
  findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(req.user.userId, id);
  }

  @Patch('cards/:id')
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(req.user.userId, id, dto);
  }

  @Delete('cards/:id')
  @HttpCode(204)
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.remove(req.user.userId, id);
  }
}
