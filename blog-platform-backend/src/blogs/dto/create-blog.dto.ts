import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsArray, ArrayMaxSize, MaxLength, MinLength, IsUrl, Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BlogStatus } from '@prisma/client';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(300)
  @Transform(({ value }: { value: string }) => value?.trim())
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  readonly content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  readonly excerpt?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  @MaxLength(2048)
  readonly coverImage?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  readonly status?: BlogStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9-]+$/, { each: true })
  @Transform(({ value }: { value: string[] }) =>
    Array.isArray(value)
      ? [...new Set(value.map((t) => t.toLowerCase().trim()))]
      : value,
  )
  @Type(() => String)
  readonly tags?: string[];
}