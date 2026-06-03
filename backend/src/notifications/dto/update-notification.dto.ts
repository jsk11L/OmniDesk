import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationChannel, NotificationTrigger } from '@prisma/client';

const URL_OR_UPLOAD = /^(?:https?:\/\/|\/uploads\/).+/i;

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @Matches(URL_OR_UPLOAD, { message: 'iconUrl must be a URL or an /uploads/ path' })
  iconUrl?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsEnum(NotificationTrigger)
  triggerType?: NotificationTrigger;

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

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
