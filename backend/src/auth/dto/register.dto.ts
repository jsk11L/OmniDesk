import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*?])[A-Za-z\d!@#$%&*?]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters with 1 uppercase letter, 1 number and 1 special character (!@#$%&*?).';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms of Service and Privacy Policy.' })
  acceptedTerms!: boolean;

  @IsBoolean()
  @Equals(true, { message: 'You must acknowledge that your data is never sold.' })
  acceptedNoDataSelling!: boolean;
}
