import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { HabitEntryStatus } from '@prisma/client';

export class MarkHabitEntryDto {
  @IsDateString()
  date!: string;

  @IsEnum(HabitEntryStatus)
  status!: HabitEntryStatus;

  /** Times logged that day (multi-count habits). Defaults to 1 when omitted. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  count?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
