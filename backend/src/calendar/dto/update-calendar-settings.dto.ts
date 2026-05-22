import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CalendarBorderStyle, CalendarSize } from '@prisma/client';

export class UpdateCalendarSettingsDto {
  @IsOptional()
  @IsEnum(CalendarSize)
  size?: CalendarSize;

  @IsOptional()
  @IsEnum(CalendarBorderStyle)
  borderStyle?: CalendarBorderStyle;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  firstDay?: number;

  @IsOptional()
  @IsIn(['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek'])
  defaultView?: string;
}
