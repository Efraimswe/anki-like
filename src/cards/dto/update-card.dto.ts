import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  front?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  back?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
