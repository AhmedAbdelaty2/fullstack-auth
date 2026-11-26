import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// The frontend uses the same dot-atom email and Unicode character rules.
const emailPattern = /^(?=.{1,254}$)(?=[^@]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,58}[a-z0-9])$/;

class EmailDto {
  @ApiProperty({ format: 'email', example: 'alex@example.com' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString({ message: 'Enter a valid email address.' })
  @Matches(emailPattern, { message: 'Enter a valid email address.' })
  email!: string;
}

export class SignInDto extends EmailDto {
  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128 })
  @IsString({ message: 'Enter your password.' })
  @Matches(/^[\s\S]{1,128}$/u, { message: 'Enter a password between 1 and 128 characters.' })
  password!: string;
}

export class SignUpDto extends EmailDto {
  @ApiProperty({ minLength: 3, maxLength: 100, example: 'Alex Morgan' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'Enter your full name.' })
  @Matches(/^.{3,100}$/u, { message: 'Enter a name between 3 and 100 characters.' })
  name!: string;

  @ApiProperty({
    format: 'password',
    minLength: 8,
    maxLength: 128,
    description: 'Use one line and include a letter, a number, and a punctuation character or symbol.',
  })
  @IsString({ message: 'Enter your password.' })
  @Matches(/^(?=[^\r\n]*\p{L})(?=[^\r\n]*\p{N})(?=[^\r\n]*[\p{P}\p{S}])[^\r\n]{8,128}$/u, {
    message: 'Use 8 to 128 characters on one line with a letter, a number, and a special character.',
  })
  password!: string;
}

export class AccountDto {
  @ApiProperty({ example: 'Alex Morgan' })
  name!: string;

  @ApiProperty({ format: 'email', example: 'alex@example.com' })
  email!: string;
}

export class AuthResultDto {
  @ApiProperty({ type: AccountDto })
  user!: AccountDto;

  @ApiProperty({ description: 'Session expiry as Unix time in milliseconds.' })
  expiresAt!: number;
}

export class ErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Check the highlighted fields.' })
  message!: string;

  @ApiProperty({ selfRequired: false, type: 'object', additionalProperties: { type: 'string' } })
  fields?: Record<string, string>;
}
