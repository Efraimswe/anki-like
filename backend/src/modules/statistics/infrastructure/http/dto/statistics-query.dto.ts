import { IsOptional, IsDateString } from 'class-validator';

export class StatisticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
