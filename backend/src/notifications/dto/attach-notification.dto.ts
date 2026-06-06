import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class AttachNotificationDto {
  @IsUUID()
  notificationId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080) // up to a week, in minutes
  minutesBefore?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'timeOfDay must be HH:MM' })
  timeOfDay?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  daysBefore?: number;
}
