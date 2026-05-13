import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TodosService } from './todos.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  // ─── Boards ──────────────────────────────────────────────

  @Get('boards')
  listBoards(@CurrentUser() user: AuthUser) {
    return this.todos.listBoards(user.id);
  }

  @Post('boards')
  createBoard(@CurrentUser() user: AuthUser, @Body() dto: CreateBoardDto) {
    return this.todos.createBoard(user.id, dto);
  }

  @Get('boards/:id')
  findBoard(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.todos.findBoardById(user.id, id);
  }

  @Patch('boards/:id')
  updateBoard(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.todos.updateBoard(user.id, id, dto);
  }

  @Delete('boards/:id')
  deleteBoard(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.todos.deleteBoard(user.id, id);
  }

  // ─── Columns ─────────────────────────────────────────────

  @Post('boards/:id/columns')
  createColumn(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.todos.createColumn(user.id, boardId, dto);
  }

  @Patch('boards/:id/columns/:colId')
  updateColumn(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('colId', ParseUUIDPipe) columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.todos.updateColumn(user.id, boardId, columnId, dto);
  }

  @Delete('boards/:id/columns/:colId')
  deleteColumn(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('colId', ParseUUIDPipe) columnId: string,
  ) {
    return this.todos.deleteColumn(user.id, boardId, columnId);
  }

  // ─── Items ───────────────────────────────────────────────

  @Post('boards/:id/columns/:colId/items')
  createItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('colId', ParseUUIDPipe) columnId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.todos.createItem(user.id, boardId, columnId, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.todos.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  deleteItem(@CurrentUser() user: AuthUser, @Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.todos.deleteItem(user.id, itemId);
  }

  @Post('items/reorder')
  reorderItems(@CurrentUser() user: AuthUser, @Body() dto: ReorderItemsDto) {
    return this.todos.reorderItems(user.id, dto);
  }
}
