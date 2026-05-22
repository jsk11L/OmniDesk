import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AttachEventNotificationDto } from './dto/attach-notification.dto';
import { UpdateCalendarSettingsDto } from './dto/update-calendar-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('events')
  list(
    @CurrentUser() user: AuthUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.calendar.list(user.id, { start, end });
  }

  @Post('events')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto) {
    return this.calendar.create(user.id, dto);
  }

  @Get('events/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.calendar.findById(user.id, id);
  }

  @Patch('events/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendar.update(user.id, id, dto);
  }

  @Delete('events/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.calendar.delete(user.id, id);
  }

  @Post('events/:id/notifications')
  attachNotification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: AttachEventNotificationDto,
  ) {
    return this.calendar.attachNotification(user.id, eventId, dto);
  }

  @Delete('events/:id/notifications/:notifId')
  detachNotification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('notifId', ParseUUIDPipe) notifId: string,
  ) {
    return this.calendar.detachNotification(user.id, eventId, notifId);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: AuthUser) {
    return this.calendar.getSettings(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCalendarSettingsDto,
  ) {
    return this.calendar.updateSettings(user.id, dto);
  }

  @Get('export')
  @Header('Content-Type', 'text/calendar')
  @Header('Content-Disposition', 'attachment; filename="omnidesk-calendar.ics"')
  async export(@CurrentUser() user: AuthUser, @Res() res: Response): Promise<void> {
    const ics = await this.calendar.exportIcs(user.id);
    res.send(ics);
  }
}
