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
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('decks/:deckId/cards')
  create(
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(deckId, dto);
  }

  @Get('decks/:deckId/cards')
  findByDeck(
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cardsService.findByDeck(deckId, {
      tag,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('cards')
  findByTag(@Query('tag') tag: string) {
    return this.cardsService.findByTag(tag);
  }

  @Get('cards/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch('cards/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(id, dto);
  }

  @Delete('cards/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.remove(id);
  }
}
