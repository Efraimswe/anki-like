import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
  Matches,
} from 'class-validator';

export enum CardType {
  BASIC = 'basic',
  REVERSE = 'reverse',
  CLOZE = 'cloze',
}

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;

  @IsEnum(CardType)
  type: CardType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
