import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
