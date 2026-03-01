import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  readonly email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(128)
  readonly password!: string;
}