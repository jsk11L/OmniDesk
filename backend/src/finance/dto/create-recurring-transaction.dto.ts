import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FinanceCategoryType, RecurringFrequency } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsEnum(FinanceCategoryType)
  type!: FinanceCategoryType;

  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  /** First occurrence (and the seed for subsequent `nextRun` advances). */
  @IsISO8601()
  nextRun!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
