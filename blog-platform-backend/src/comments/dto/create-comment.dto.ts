import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => value?.trim())
  readonly body!: string;

  @IsOptional()
  @IsUUID('4')
  readonly parentId?: string;
}