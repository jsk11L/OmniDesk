import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TodoBoard, TodoColumn, TodoItem } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Boards ──────────────────────────────────────────────

  listBoards(userId: string): Promise<TodoBoard[]> {
    return this.prisma.todoBoard.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findBoardById(userId: string, id: string): Promise<TodoBoard> {
    const board = await this.prisma.todoBoard.findFirst({
      where: { id, userId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            items: { orderBy: { position: 'asc' } },
          },
        },
      },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  createBoard(userId: string, dto: CreateBoardDto): Promise<TodoBoard> {
    return this.prisma.todoBoard.create({
      data: { userId, name: dto.name, isDefault: false },
    });
  }

  async updateBoard(
    userId: string,
    id: string,
    dto: UpdateBoardDto,
  ): Promise<TodoBoard> {
    await this.assertBoardOwner(userId, id);
    return this.prisma.todoBoard.update({
      where: { id },
      data: { name: dto.name ?? undefined },
    });
  }

  async deleteBoard(userId: string, id: string): Promise<{ id: string }> {
    const board = await this.assertBoardOwner(userId, id);
    if (board.isSystem) {
      throw new BadRequestException('The Personal Board cannot be deleted');
    }
    await this.prisma.todoBoard.delete({ where: { id } });
    return { id };
  }

  // ─── Columns ─────────────────────────────────────────────

  async createColumn(
    userId: string,
    boardId: string,
    dto: CreateColumnDto,
  ): Promise<TodoColumn> {
    await this.assertBoardOwner(userId, boardId);
    const position = dto.position ?? (await this.nextColumnPosition(boardId));
    return this.prisma.todoColumn.create({
      data: {
        boardId,
        name: dto.name,
        color: dto.color ?? '#94a3b8',
        position,
        isCompletionColumn: dto.isCompletionColumn ?? false,
      },
    });
  }

  async updateColumn(
    userId: string,
    boardId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ): Promise<TodoColumn> {
    const column = await this.findColumnInBoard(userId, boardId, columnId);
    return this.prisma.todoColumn.update({
      where: { id: columnId },
      data: {
        name: dto.name ?? column.name,
        color: dto.color ?? column.color,
        position: dto.position ?? column.position,
        isCompletionColumn: dto.isCompletionColumn ?? column.isCompletionColumn,
      },
    });
  }

  async deleteColumn(
    userId: string,
    boardId: string,
    columnId: string,
  ): Promise<{ id: string }> {
    await this.findColumnInBoard(userId, boardId, columnId);
    await this.prisma.todoColumn.delete({ where: { id: columnId } });
    return { id: columnId };
  }

  // ─── Items ───────────────────────────────────────────────

  async createItem(
    userId: string,
    boardId: string,
    columnId: string,
    dto: CreateItemDto,
  ): Promise<TodoItem> {
    await this.findColumnInBoard(userId, boardId, columnId);
    const position = dto.position ?? (await this.nextItemPosition(columnId));
    return this.prisma.todoItem.create({
      data: {
        columnId,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        hasDueDate: dto.hasDueDate ?? !!dto.dueDate,
        priority: dto.priority ?? 'MEDIUM',
        hasPriority: dto.hasPriority ?? false,
        tags: dto.tags ?? [],
        position,
      },
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<TodoItem> {
    const item = await this.findItemForUser(userId, itemId);

    if (dto.columnId && dto.columnId !== item.columnId) {
      const targetColumn = await this.prisma.todoColumn.findFirst({
        where: { id: dto.columnId, board: { userId } },
      });
      if (!targetColumn) {
        throw new NotFoundException('Target column not found');
      }
    }

    return this.prisma.todoItem.update({
      where: { id: itemId },
      data: {
        title: dto.title ?? item.title,
        description: dto.description ?? item.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : item.dueDate,
        hasDueDate: dto.hasDueDate ?? item.hasDueDate,
        priority: dto.priority ?? item.priority,
        hasPriority: dto.hasPriority ?? item.hasPriority,
        tags: dto.tags ?? item.tags,
        columnId: dto.columnId ?? item.columnId,
        position: dto.position ?? item.position,
      },
    });
  }

  async deleteItem(userId: string, itemId: string): Promise<{ id: string }> {
    await this.findItemForUser(userId, itemId);
    await this.prisma.todoItem.delete({ where: { id: itemId } });
    return { id: itemId };
  }

  async reorderItems(userId: string, dto: ReorderItemsDto): Promise<{ updated: number }> {
    if (dto.items.length === 0) {
      throw new BadRequestException('items array cannot be empty');
    }

    const itemIds = dto.items.map((i) => i.id);
    const columnIds = Array.from(new Set(dto.items.map((i) => i.columnId)));

    const owned = await this.prisma.todoItem.findMany({
      where: { id: { in: itemIds }, column: { board: { userId } } },
      select: { id: true },
    });
    if (owned.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    const targetColumns = await this.prisma.todoColumn.findMany({
      where: { id: { in: columnIds }, board: { userId } },
      select: { id: true },
    });
    if (targetColumns.length !== columnIds.length) {
      throw new NotFoundException('One or more target columns not found');
    }

    await this.prisma.$transaction(
      dto.items.map((entry) =>
        this.prisma.todoItem.update({
          where: { id: entry.id },
          data: { columnId: entry.columnId, position: entry.position },
        }),
      ),
    );

    return { updated: dto.items.length };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async assertBoardOwner(userId: string, boardId: string): Promise<TodoBoard> {
    const board = await this.prisma.todoBoard.findFirst({
      where: { id: boardId, userId },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  private async findColumnInBoard(
    userId: string,
    boardId: string,
    columnId: string,
  ): Promise<TodoColumn> {
    const column = await this.prisma.todoColumn.findFirst({
      where: { id: columnId, boardId, board: { userId } },
    });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }

  private async findItemForUser(userId: string, itemId: string): Promise<TodoItem> {
    const item = await this.prisma.todoItem.findFirst({
      where: { id: itemId, column: { board: { userId } } },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  private async nextColumnPosition(boardId: string): Promise<number> {
    const last = await this.prisma.todoColumn.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  private async nextItemPosition(columnId: string): Promise<number> {
    const last = await this.prisma.todoItem.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }
}
