import { Type, Transform } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 1)
  @Type(() => Number)
  page: number;

  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 10)
  @Type(() => Number)
  limit: number;
}