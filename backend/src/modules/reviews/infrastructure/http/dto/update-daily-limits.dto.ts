import { IsInt, Min, IsOptional } from 'class-validator';

export class UpdateDailyLimitsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  maxNewCards?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxReviews?: number;
}
