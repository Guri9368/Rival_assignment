import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 20;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  readonly tag?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  readonly author?: string;
}