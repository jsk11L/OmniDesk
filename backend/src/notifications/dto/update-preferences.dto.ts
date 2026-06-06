import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string; // IANA zone, e.g. "America/Santiago"

  // Allow null to clear; otherwise must be HH:MM.
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(HHMM, { message: 'dndStart must be HH:MM' })
  dndStart?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(HHMM, { message: 'dndEnd must be HH:MM' })
  dndEnd?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  quietDays?: number[];
}
