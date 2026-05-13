import { IsUUID } from 'class-validator';

export class AttachNoteNotificationDto {
  @IsUUID()
  notificationId!: string;
}
