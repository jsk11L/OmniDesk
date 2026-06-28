import { IsString, MaxLength, MinLength } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  code!: string;
}

export class TwoFactorLoginDto {
  @IsString()
  @MinLength(1)
  tempToken!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  code!: string;
}
