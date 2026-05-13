import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AttachEventNotificationDto } from './dto/attach-notification.dto';

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
}
