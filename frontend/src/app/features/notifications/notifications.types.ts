export type NotificationTrigger = 'MANUAL' | 'SCHEDULED' | 'RECURRING';
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

export interface NotificationConfig {
  id: string;
  userId: string;
  title: string;
  message: string;
  iconUrl: string | null;
  accentColor: string;
  triggerType: NotificationTrigger;
  scheduledAt: string | null;
  recurringRule: string | null;
  isRecurring: boolean;
  channels: NotificationChannel[];
  isActive: boolean;
  isFired: boolean;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  createdAt: string;
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
