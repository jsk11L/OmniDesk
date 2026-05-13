import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationChannel, NotificationTrigger } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  iconUrl?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsEnum(NotificationTrigger)
  triggerType!: NotificationTrigger;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  recurringRule?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
