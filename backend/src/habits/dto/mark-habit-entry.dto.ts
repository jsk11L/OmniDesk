import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { HabitEntryStatus } from '@prisma/client';

export class MarkHabitEntryDto {
  @IsDateString()
  date!: string;

  @IsEnum(HabitEntryStatus)
  status!: HabitEntryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
