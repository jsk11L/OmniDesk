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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AttachNoteNotificationDto } from './dto/attach-note-notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('pinned') pinned?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notes.list(user.id, { q, tag, pinned, page, limit });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoteDto) {
    return this.notes.create(user.id, dto);
  }

  /** All anchored notes (with their element's live label). */
  @Get('anchored')
  listAnchored(@CurrentUser() user: AuthUser) {
    return this.notes.listAnchored(user.id);
  }

  /** The note anchored to a given element, or null. */
  @Get('anchor')
  findByAnchor(
    @CurrentUser() user: AuthUser,
    @Query('type') type: string,
    @Query('id', ParseUUIDPipe) id: string,
  ) {
    return this.notes.findByAnchor(user.id, type, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notes.findById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notes.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notes.delete(user.id, id);
  }

  @Post(':id/notifications')
  attachNotification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) noteId: string,
    @Body() dto: AttachNoteNotificationDto,
  ) {
    return this.notes.attachNotification(user.id, noteId, dto);
  }

  @Delete(':id/notifications/:notifId')
  detachNotification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) noteId: string,
    @Param('notifId', ParseUUIDPipe) notifId: string,
  ) {
    return this.notes.detachNotification(user.id, noteId, notifId);
  }
}
