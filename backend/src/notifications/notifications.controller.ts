import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { AttachmentService, type AttachEntityType } from './attachment.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { AttachNotificationDto } from './dto/attach-notification.dto';
import {
  PushSubscriptionDto,
  UnsubscribePushDto,
} from './dto/push-subscription.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly attachments: AttachmentService,
  ) {}

  // ─── Configs ─────────────────────────────────────────────

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNotificationDto) {
    return this.notifications.create(user.id, dto);
  }

  @Get('inbox')
  listInbox(@CurrentUser() user: AuthUser) {
    return this.notifications.listInbox(user.id);
  }

  @Delete('inbox/clear')
  @HttpCode(HttpStatus.OK)
  clearInbox(@CurrentUser() user: AuthUser) {
    return this.notifications.clearInbox(user.id);
  }

  @Patch('inbox/:id/read')
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markAsRead(user.id, id);
  }

  @Post('push/subscribe')
  subscribePush(@CurrentUser() user: AuthUser, @Body() dto: PushSubscriptionDto) {
    return this.notifications.subscribePush(user.id, dto);
  }

  @Delete('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribePush(@CurrentUser() user: AuthUser, @Body() dto: UnsubscribePushDto) {
    return this.notifications.unsubscribePush(user.id, dto);
  }

  // ─── Attach to entities (Block 3) ────────────────────────

  @Get('targets/:type/:entityId')
  listTargets(
    @CurrentUser() user: AuthUser,
    @Param('type') type: AttachEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.attachments.list(type, entityId, user.id);
  }

  @Post('targets/:type/:entityId')
  attach(
    @CurrentUser() user: AuthUser,
    @Param('type') type: AttachEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: AttachNotificationDto,
  ) {
    return this.attachments.attach(type, entityId, dto.notificationId, user.id, {
      minutesBefore: dto.minutesBefore,
      timeOfDay: dto.timeOfDay,
      daysBefore: dto.daysBefore,
    });
  }

  @Delete('targets/:type/:entityId/:notificationId')
  @HttpCode(HttpStatus.OK)
  detach(
    @CurrentUser() user: AuthUser,
    @Param('type') type: AttachEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    return this.attachments.detach(type, entityId, notificationId, user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.findById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notifications.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.delete(user.id, id);
  }

  @Post(':id/fire')
  @HttpCode(HttpStatus.OK)
  fire(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.fire(user.id, id);
  }
}
