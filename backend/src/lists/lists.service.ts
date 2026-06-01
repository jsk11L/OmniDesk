import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  List,
  ListField,
  ListItem,
  ListTag,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { JsonSanitizationError, sanitizeJson } from '../common/utils/sanitize-json';
import {
  Paginated,
  PaginationQuery,
  buildPageMeta,
  resolvePagination,
} from '../common/pagination';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { CreateListFieldDto } from './dto/create-list-field.dto';
import { UpdateListFieldDto } from './dto/update-list-field.dto';
import { CreateListTagDto } from './dto/create-list-tag.dto';
import { MoveListItemDto } from './dto/move-list-item.dto';

function safeSanitize(value: unknown): unknown {
  try {
    return sanitizeJson(value);
  } catch (err) {
    if (err instanceof JsonSanitizationError) {
      throw new BadRequestException(err.message);
    }
    throw err;
  }
}

const SORTABLE_FIELDS = ['title', 'position', 'createdAt', 'updatedAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

export interface ListItemsQuery extends PaginationQuery {
  q?: string;
  tag?: string;
  sort?: string;
  dir?: string;
}

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Lists ───────────────────────────────────────────────

  listForUser(userId: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(userId: string, id: string): Promise<List> {
    const list = await this.prisma.list.findFirst({
      where: { id, userId },
      include: {
        fields: { orderBy: { position: 'asc' } },
        tags: { orderBy: { name: 'asc' } },
      },
    });
    if (!list) {
      throw new NotFoundException('List not found');
    }
    return list;
  }

  create(userId: string, dto: CreateListDto): Promise<List> {
    return this.prisma.list.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        defaultView: dto.defaultView ?? 'GRID',
        defaultSortField: dto.defaultSortField ?? null,
        defaultSortDir: dto.defaultSortDir ?? 'ASC',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateListDto): Promise<List> {
    const list = await this.assertOwner(userId, id);
    const data: Prisma.ListUpdateInput = {
      name: dto.name ?? list.name,
      description: dto.description ?? list.description,
      icon: dto.icon ?? list.icon,
      coverImageUrl: dto.coverImageUrl ?? list.coverImageUrl,
      defaultView: dto.defaultView ?? list.defaultView,
      defaultSortField: dto.defaultSortField ?? list.defaultSortField,
      defaultSortDir: dto.defaultSortDir ?? list.defaultSortDir,
    };
    if (dto.gridConfig !== undefined) {
      data.gridConfig = safeSanitize(dto.gridConfig) as Prisma.InputJsonValue;
    }
    if (dto.viewConfig !== undefined) {
      data.viewConfig = safeSanitize(dto.viewConfig) as Prisma.InputJsonValue;
    }
    return this.prisma.list.update({ where: { id }, data });
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    await this.assertOwner(userId, id);
    await this.prisma.list.delete({ where: { id } });
    return { id };
  }

  // ─── Items ───────────────────────────────────────────────

  async listItems(
    userId: string,
    listId: string,
    query: ListItemsQuery,
  ): Promise<Paginated<ListItem>> {
    await this.assertOwner(userId, listId);

    const where: Prisma.ListItemWhereInput = { listId };
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }
    if (query.tag) {
      where.tags = {
        some: {
          tag: { name: { equals: query.tag, mode: 'insensitive' }, listId },
        },
      };
    }

    const sort = this.resolveSortField(query.sort);
    const dir: Prisma.SortOrder = query.dir?.toUpperCase() === 'DESC' ? 'desc' : 'asc';

    const pagination = resolvePagination(query);
    const [data, total] = await Promise.all([
      this.prisma.listItem.findMany({
        where,
        orderBy: { [sort]: dir },
        include: { tags: { include: { tag: true } } },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.listItem.count({ where }),
    ]);

    return { data, meta: buildPageMeta(pagination, total) };
  }

  async createItem(
    userId: string,
    listId: string,
    dto: CreateListItemDto,
  ): Promise<ListItem> {
    await this.assertOwner(userId, listId);
    if (dto.tagIds?.length) {
      await this.assertTagsBelongToList(listId, dto.tagIds);
    }
    const position = dto.position ?? (await this.nextItemPosition(listId));

    return this.prisma.listItem.create({
      data: {
        listId,
        title: dto.title,
        customFields: safeSanitize(dto.customFields ?? {}) as Prisma.InputJsonValue,
        position,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: UpdateListItemDto,
  ): Promise<ListItem> {
    await this.assertOwner(userId, listId);
    const item = await this.prisma.listItem.findFirst({ where: { id: itemId, listId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    if (dto.tagIds) {
      await this.assertTagsBelongToList(listId, dto.tagIds);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.tagIds) {
        await tx.listItemTag.deleteMany({ where: { itemId } });
        if (dto.tagIds.length > 0) {
          await tx.listItemTag.createMany({
            data: dto.tagIds.map((tagId) => ({ itemId, tagId })),
          });
        }
      }

      const data: Prisma.ListItemUpdateInput = {
        title: dto.title ?? item.title,
        position: dto.position ?? item.position,
      };
      if (dto.customFields !== undefined) {
        data.customFields = safeSanitize(dto.customFields) as Prisma.InputJsonValue;
      }

      return tx.listItem.update({
        where: { id: itemId },
        data,
        include: { tags: { include: { tag: true } } },
      });
    });
  }

  async deleteItem(
    userId: string,
    listId: string,
    itemId: string,
  ): Promise<{ id: string }> {
    await this.assertOwner(userId, listId);
    const item = await this.prisma.listItem.findFirst({ where: { id: itemId, listId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    await this.prisma.listItem.delete({ where: { id: itemId } });
    return { id: itemId };
  }

  /**
   * Move an item from one list to another, remapping customFields by field name
   * and tags by tag name. Optional `customFieldsPatch` is merged on top so callers
   * can fill in completion-time fields (year, month, computed index, etc).
   *
   * The remap-by-name strategy means that if both lists have a field called
   * "Plataforma", values transfer cleanly. Source fields with no matching
   * destination field are dropped.
   */
  async moveItem(
    userId: string,
    sourceListId: string,
    itemId: string,
    dto: MoveListItemDto,
  ): Promise<ListItem> {
    if (sourceListId === dto.targetListId) {
      throw new BadRequestException('Source and target lists must be different');
    }
    await this.assertOwner(userId, sourceListId);
    await this.assertOwner(userId, dto.targetListId);

    const item = await this.prisma.listItem.findFirst({
      where: { id: itemId, listId: sourceListId },
      include: { tags: { include: { tag: true } } },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const [sourceFields, targetFields, targetTags] = await Promise.all([
      this.prisma.listField.findMany({ where: { listId: sourceListId } }),
      this.prisma.listField.findMany({ where: { listId: dto.targetListId } }),
      this.prisma.listTag.findMany({ where: { listId: dto.targetListId } }),
    ]);

    const targetFieldByName = new Map(
      targetFields.map((f) => [f.name.trim().toLowerCase(), f]),
    );

    const remapped: Record<string, unknown> = {};
    const sourceCustomFields = (item.customFields ?? {}) as Record<string, unknown>;
    for (const srcField of sourceFields) {
      const dest = targetFieldByName.get(srcField.name.trim().toLowerCase());
      if (!dest) continue;
      const value = sourceCustomFields[srcField.id];
      if (value === undefined) continue;
      remapped[dest.id] = value;
    }

    const patch = dto.customFieldsPatch ?? {};
    const mergedCustomFields = safeSanitize({ ...remapped, ...patch }) as Prisma.InputJsonValue;

    const targetTagByName = new Map(
      targetTags.map((t) => [t.name.trim().toLowerCase(), t.id]),
    );
    const carriedTagIds: string[] = [];
    for (const link of item.tags) {
      const targetId = targetTagByName.get(link.tag.name.trim().toLowerCase());
      if (targetId) carriedTagIds.push(targetId);
    }

    const nextPosition = await this.nextItemPosition(dto.targetListId);

    return this.prisma.$transaction(async (tx) => {
      const moved = await tx.listItem.create({
        data: {
          listId: dto.targetListId,
          title: dto.title?.trim() || item.title,
          customFields: mergedCustomFields,
          position: nextPosition,
          tags: carriedTagIds.length
            ? { create: carriedTagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: { tags: { include: { tag: true } } },
      });
      await tx.listItem.delete({ where: { id: itemId } });
      return moved;
    });
  }

  // ─── Fields ──────────────────────────────────────────────

  async createField(
    userId: string,
    listId: string,
    dto: CreateListFieldDto,
  ): Promise<ListField> {
    await this.assertOwner(userId, listId);
    const position = dto.position ?? (await this.nextFieldPosition(listId));

    const data: Prisma.ListFieldUncheckedCreateInput = {
      listId,
      name: dto.name,
      fieldType: dto.fieldType,
      isRequired: dto.isRequired ?? false,
      position,
      defaultValue: dto.defaultValue ?? null,
    };
    if (dto.options !== undefined) {
      data.options = safeSanitize(dto.options) as Prisma.InputJsonValue;
    }

    return this.prisma.listField.create({ data });
  }

  async updateField(
    userId: string,
    listId: string,
    fieldId: string,
    dto: UpdateListFieldDto,
  ): Promise<ListField> {
    await this.assertOwner(userId, listId);
    const field = await this.prisma.listField.findFirst({
      where: { id: fieldId, listId },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    const data: Prisma.ListFieldUpdateInput = {
      name: dto.name ?? field.name,
      fieldType: dto.fieldType ?? field.fieldType,
      isRequired: dto.isRequired ?? field.isRequired,
      position: dto.position ?? field.position,
      defaultValue: dto.defaultValue ?? field.defaultValue,
    };
    if (dto.options !== undefined) {
      data.options = safeSanitize(dto.options) as Prisma.InputJsonValue;
    }

    return this.prisma.listField.update({ where: { id: fieldId }, data });
  }

  async deleteField(
    userId: string,
    listId: string,
    fieldId: string,
  ): Promise<{ id: string }> {
    await this.assertOwner(userId, listId);
    const field = await this.prisma.listField.findFirst({
      where: { id: fieldId, listId },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }
    await this.prisma.listField.delete({ where: { id: fieldId } });
    return { id: fieldId };
  }

  // ─── Tags ────────────────────────────────────────────────

  async createTag(
    userId: string,
    listId: string,
    dto: CreateListTagDto,
  ): Promise<ListTag> {
    await this.assertOwner(userId, listId);
    return this.prisma.listTag.create({
      data: {
        listId,
        name: dto.name,
        color: dto.color ?? '#94a3b8',
      },
    });
  }

  async deleteTag(
    userId: string,
    listId: string,
    tagId: string,
  ): Promise<{ id: string }> {
    await this.assertOwner(userId, listId);
    const tag = await this.prisma.listTag.findFirst({ where: { id: tagId, listId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await this.prisma.listTag.delete({ where: { id: tagId } });
    return { id: tagId };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async assertOwner(userId: string, listId: string): Promise<List> {
    const list = await this.prisma.list.findFirst({ where: { id: listId, userId } });
    if (!list) {
      throw new NotFoundException('List not found');
    }
    return list;
  }

  private async assertTagsBelongToList(listId: string, tagIds: string[]): Promise<void> {
    const found = await this.prisma.listTag.findMany({
      where: { id: { in: tagIds }, listId },
      select: { id: true },
    });
    if (found.length !== tagIds.length) {
      throw new NotFoundException('One or more tags not found in this list');
    }
  }

  private async nextItemPosition(listId: string): Promise<number> {
    const last = await this.prisma.listItem.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  private async nextFieldPosition(listId: string): Promise<number> {
    const last = await this.prisma.listField.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  private resolveSortField(sort?: string): SortableField {
    if (sort && (SORTABLE_FIELDS as readonly string[]).includes(sort)) {
      return sort as SortableField;
    }
    return 'position';
  }
}
