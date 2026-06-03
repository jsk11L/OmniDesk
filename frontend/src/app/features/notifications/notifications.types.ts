// Entity shapes from the Prisma-generated source (D-011). The inbox API nests
// its NotificationConfig, composed here.
import type {
  InAppNotification as InAppNotificationBase,
  NotificationConfig,
  NotificationTrigger,
  NotificationChannel,
} from '@omnidesk/shared';

export type { NotificationConfig, NotificationTrigger, NotificationChannel };

export interface InAppNotification extends InAppNotificationBase {
  notification?: NotificationConfig;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  iconUrl?: string;
  accentColor?: string;
  triggerType: NotificationTrigger;
  scheduledAt?: string;
  recurringRule?: string;
  isRecurring?: boolean;
  channels: NotificationChannel[];
  isActive?: boolean;
}

export type UpdateNotificationDto = Partial<CreateNotificationDto>;
