import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Note, NoteNotification } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  Paginated,
  PaginationQuery,
  buildPageMeta,
  resolvePagination,
} from '../common/pagination';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AttachNoteNotificationDto } from './dto/attach-note-notification.dto';

export interface ListNotesParams extends PaginationQuery {
  q?: string;
  tag?: string;
  pinned?: string;
}

/**
 * Sidebar projection: everything EXCEPT `content`/`plainText`. A vault-sized
 * account was shipping megabytes of note bodies on every list/search request;
 * the editor loads the full note via findById when one is opened.
 */
const NOTE_LIST_SELECT = {
  id: true,
  userId: true,
  title: true,
  description: true,
  icon: true,
  coverImageUrl: true,
  isPinned: true,
  tags: true,
  anchorType: true,
  anchorId: true,
  createdAt: true,
  updatedAt: true,
  notifications: true,
} satisfies Prisma.NoteSelect;

export type NoteListEntry = Prisma.NoteGetPayload<{ select: typeof NOTE_LIST_SELECT }>;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, params: ListNotesParams): Promise<Paginated<NoteListEntry>> {
    // Anchored notes live with their element, not in the main notes list.
    const where: Prisma.NoteWhereInput = { userId, anchorType: null };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { plainText: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.tag) {
      where.tags = { has: params.tag };
    }
    if (params.pinned !== undefined) {
      where.isPinned = params.pinned === 'true';
    }

    const pagination = resolvePagination(params);
    const [data, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        select: NOTE_LIST_SELECT,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.note.count({ where }),
    ]);

    return { data, meta: buildPageMeta(pagination, total) };
  }

  async findById(userId: string, id: string): Promise<Note> {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: { notifications: true },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const content = dto.content ?? '';
    const anchor = await this.resolveAnchor(userId, dto.anchorType, dto.anchorId);
    try {
      return await this.prisma.note.create({
        data: {
          userId,
          title: dto.title,
          content,
          plainText: this.derivePlainText(content),
          description: dto.description ?? null,
          icon: dto.icon ?? null,
          coverImageUrl: dto.coverImageUrl ?? null,
          isPinned: dto.isPinned ?? false,
          tags: dto.tags ?? [],
          anchorType: anchor?.type ?? null,
          anchorId: anchor?.id ?? null,
        },
      });
    } catch (err) {
      // Concurrent create for the same anchor slips past resolveAnchor's check
      // and hits the unique index — answer 400, not 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('This element already has an anchored note');
      }
      throw err;
    }
  }

  /** Notes anchored to an element, with the element's live label resolved. */
  async listAnchored(userId: string): Promise<(Note & { anchorLabel: string | null })[]> {
    const notes = await this.prisma.note.findMany({
      where: { userId, NOT: { anchorType: null } },
      orderBy: { updatedAt: 'desc' },
      include: { notifications: true },
    });

    const eventIds = notes.filter((n) => n.anchorType === 'event' && n.anchorId).map((n) => n.anchorId!);
    const itemIds = notes.filter((n) => n.anchorType === 'list-item' && n.anchorId).map((n) => n.anchorId!);
    const [events, items] = await Promise.all([
      eventIds.length
        ? this.prisma.calendarEvent.findMany({ where: { id: { in: eventIds } }, select: { id: true, title: true } })
        : [],
      itemIds.length
        ? this.prisma.listItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, title: true } })
        : [],
    ]);

    const labels = new Map<string, string>();
    for (const e of events) labels.set(e.id, e.title);
    for (const it of items) labels.set(it.id, it.title);

    return notes.map((n) => ({ ...n, anchorLabel: n.anchorId ? labels.get(n.anchorId) ?? null : null }));
  }

  /** The note anchored to a given element, or null. */
  async findByAnchor(userId: string, type: string, id: string): Promise<Note | null> {
    return this.prisma.note.findFirst({
      where: { userId, anchorType: type, anchorId: id },
      include: { notifications: true },
    });
  }

  /** Validate an anchor target belongs to the user and has no note yet. */
  private async resolveAnchor(
    userId: string,
    type?: string,
    id?: string,
  ): Promise<{ type: string; id: string } | null> {
    if (!type && !id) return null;
    if (!type || !id) {
      throw new BadRequestException('anchorType and anchorId must be provided together');
    }

    if (type === 'event') {
      const ev = await this.prisma.calendarEvent.findFirst({ where: { id, userId }, select: { id: true } });
      if (!ev) throw new NotFoundException('Anchor event not found');
    } else if (type === 'list-item') {
      const it = await this.prisma.listItem.findFirst({
        where: { id, list: { userId } },
        select: { id: true },
      });
      if (!it) throw new NotFoundException('Anchor item not found');
    } else {
      throw new BadRequestException('Invalid anchorType');
    }

    const existing = await this.prisma.note.findFirst({ where: { anchorType: type, anchorId: id } });
    if (existing) {
      throw new BadRequestException('This element already has an anchored note');
    }
    return { type, id };
  }

  /** A user may keep at most this many pinned notes at once. */
  private static readonly MAX_PINNED = 5;

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findById(userId, id);

    // Cap pinned notes — only check when newly pinning (not already pinned).
    if (dto.isPinned === true && !note.isPinned) {
      const pinnedCount = await this.prisma.note.count({
        where: { userId, isPinned: true },
      });
      if (pinnedCount >= NotesService.MAX_PINNED) {
        throw new BadRequestException(
          `You can pin at most ${NotesService.MAX_PINNED} notes. Unpin one first.`,
        );
      }
    }

    const content = dto.content ?? note.content;
    return this.prisma.note.update({
      where: { id },
      data: {
        title: dto.title ?? note.title,
        content,
        plainText: this.derivePlainText(content),
        description: dto.description ?? note.description,
        icon: dto.icon ?? note.icon,
        coverImageUrl: dto.coverImageUrl ?? note.coverImageUrl,
        isPinned: dto.isPinned ?? note.isPinned,
        tags: dto.tags ?? note.tags,
      },
    });
  }

  /**
   * Derives a flat, searchable plain-text representation from a note's content.
   * Notes are stored as a serialized TipTap JSON document; we walk the node
   * tree collecting `text` leaves. If the content is not JSON (legacy or empty
   * notes) it is treated as already-plain text.
   */
  private derivePlainText(content: string | null | undefined): string {
    if (!content) return '';

    let doc: unknown;
    try {
      doc = JSON.parse(content);
    } catch {
      return content.replace(/\s+/g, ' ').trim();
    }

    const parts: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      const n = node as { text?: unknown; content?: unknown };
      if (typeof n.text === 'string') parts.push(n.text);
      if (Array.isArray(n.content)) {
        for (const child of n.content) walk(child);
      }
    };
    walk(doc);

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    await this.findById(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { id };
  }

  async attachNotification(
    userId: string,
    noteId: string,
    dto: AttachNoteNotificationDto,
  ): Promise<NoteNotification> {
    await this.findById(userId, noteId);

    const notification = await this.prisma.notificationConfig.findFirst({
      where: { id: dto.notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification config not found');
    }

    return this.prisma.noteNotification.create({
      data: { noteId, notificationId: dto.notificationId },
    });
  }

  async detachNotification(
    userId: string,
    noteId: string,
    entryId: string,
  ): Promise<{ id: string }> {
    await this.findById(userId, noteId);

    const entry = await this.prisma.noteNotification.findFirst({
      where: { id: entryId, noteId },
    });
    if (!entry) {
      throw new NotFoundException('Notification link not found');
    }

    await this.prisma.noteNotification.delete({ where: { id: entryId } });
    return { id: entryId };
  }
}
