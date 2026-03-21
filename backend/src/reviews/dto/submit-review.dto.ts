import { IsUUID, IsEnum, IsOptional, IsInt, Min } from 'class-validator';

export enum RatingInput {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

export class SubmitReviewDto {
  @IsUUID()
  cardId: string;

  @IsEnum(RatingInput)
  rating: RatingInput;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTakenMs?: number;
}
