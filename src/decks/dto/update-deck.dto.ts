import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateDeckDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;
}
