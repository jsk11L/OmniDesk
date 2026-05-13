import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AttachEventNotificationDto {
  @IsUUID()
  notificationId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 24 * 30)
  minutesBefore?: number;
}
