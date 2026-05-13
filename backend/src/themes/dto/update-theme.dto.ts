import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isDark?: boolean;

  @IsOptional()
  @IsHexColor()
  colorPrimary?: string;

  @IsOptional()
  @IsHexColor()
  colorSecondary?: string;

  @IsOptional()
  @IsHexColor()
  colorBackground?: string;

  @IsOptional()
  @IsHexColor()
  colorSurface?: string;

  @IsOptional()
  @IsHexColor()
  colorSurfaceHover?: string;

  @IsOptional()
  @IsHexColor()
  colorBorder?: string;

  @IsOptional()
  @IsHexColor()
  colorText?: string;

  @IsOptional()
  @IsHexColor()
  colorTextMuted?: string;

  @IsOptional()
  @IsHexColor()
  colorAccent?: string;

  @IsOptional()
  @IsHexColor()
  colorDanger?: string;

  @IsOptional()
  @IsHexColor()
  colorSuccess?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fontFamily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  borderRadius?: string;
}
