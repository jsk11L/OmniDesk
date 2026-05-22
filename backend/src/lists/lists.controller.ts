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
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { CreateListFieldDto } from './dto/create-list-field.dto';
import { UpdateListFieldDto } from './dto/update-list-field.dto';
import { CreateListTagDto } from './dto/create-list-tag.dto';
import { MoveListItemDto } from './dto/move-list-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  // ─── Lists ───────────────────────────────────────────────

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.lists.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListDto) {
    return this.lists.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.findById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.lists.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.lists.delete(user.id, id);
  }

  // ─── Items ───────────────────────────────────────────────

  @Get(':id/items')
  listItems(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
  ) {
    return this.lists.listItems(user.id, listId, { q, tag, sort, dir });
  }

  @Post(':id/items')
  createItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Body() dto: CreateListItemDto,
  ) {
    return this.lists.createItem(user.id, listId, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateListItemDto,
  ) {
    return this.lists.updateItem(user.id, listId, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  deleteItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.lists.deleteItem(user.id, listId, itemId);
  }

  @Post(':id/items/:itemId/move')
  moveItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: MoveListItemDto,
  ) {
    return this.lists.moveItem(user.id, listId, itemId, dto);
  }

  // ─── Fields ──────────────────────────────────────────────

  @Post(':id/fields')
  createField(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Body() dto: CreateListFieldDto,
  ) {
    return this.lists.createField(user.id, listId, dto);
  }

  @Patch(':id/fields/:fieldId')
  updateField(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: UpdateListFieldDto,
  ) {
    return this.lists.updateField(user.id, listId, fieldId, dto);
  }

  @Delete(':id/fields/:fieldId')
  deleteField(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ) {
    return this.lists.deleteField(user.id, listId, fieldId);
  }

  // ─── Tags ────────────────────────────────────────────────

  @Post(':id/tags')
  createTag(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Body() dto: CreateListTagDto,
  ) {
    return this.lists.createTag(user.id, listId, dto);
  }

  @Delete(':id/tags/:tagId')
  deleteTag(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) listId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.lists.deleteTag(user.id, listId, tagId);
  }
}
