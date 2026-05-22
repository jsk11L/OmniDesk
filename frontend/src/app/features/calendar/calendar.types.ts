export interface CalendarEventNotification {
  id: string;
  eventId: string;
  notificationId: string;
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  notifications?: CalendarEventNotification[];
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  color?: string;
  location?: string;
}

export type UpdateEventDto = Partial<CreateEventDto>;

export type CalendarSize = 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
export type CalendarBorderStyle = 'SQUARE' | 'ROUNDED';

export interface CalendarSettings {
  id: string;
  userId: string;
  size: CalendarSize;
  borderStyle: CalendarBorderStyle;
  firstDay: number;
  defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  updatedAt: string;
}

export interface UpdateCalendarSettingsDto {
  size?: CalendarSize;
  borderStyle?: CalendarBorderStyle;
  firstDay?: number;
  defaultView?: CalendarSettings['defaultView'];
}
