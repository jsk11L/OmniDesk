// Entity shapes from the Prisma-generated source (D-011). The API nests
// notifications on an event; `defaultView` is narrowed to the FullCalendar
// view union the frontend works with (Prisma stores it as a plain string).
import type {
  CalendarEvent as CalendarEventBase,
  CalendarSettings as CalendarSettingsBase,
  CalendarEventNotification,
} from '@omnidesk/shared';

export type { CalendarEventNotification };
export type { CalendarSize, CalendarBorderStyle } from '@omnidesk/shared';

export interface CalendarEvent extends CalendarEventBase {
  notifications?: CalendarEventNotification[];
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface CalendarSettings extends Omit<CalendarSettingsBase, 'defaultView'> {
  defaultView: CalendarView;
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

export interface UpdateCalendarSettingsDto {
  size?: CalendarSettings['size'];
  borderStyle?: CalendarSettings['borderStyle'];
  firstDay?: number;
  defaultView?: CalendarView;
}
