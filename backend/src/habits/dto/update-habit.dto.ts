import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GoalPeriod } from '@prisma/client';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR)
  color?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  activeDays?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7)
  weeklyGoal?: number;

  @IsOptional()
  @IsEnum(GoalPeriod)
  goalPeriod?: GoalPeriod;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(366)
  goalTarget?: number;
}
