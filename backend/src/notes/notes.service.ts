import { Injectable, NotFoundException } from '@nestjs/common';
import type { Note, NoteNotification, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AttachNoteNotificationDto } from './dto/attach-note-notification.dto';

export interface ListNotesParams {
  q?: string;
  tag?: string;
  pinned?: string;
}

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, params: ListNotesParams): Promise<Note[]> {
    const where: Prisma.NoteWhereInput = { userId };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { content: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.tag) {
      where.tags = { has: params.tag };
    }
    if (params.pinned !== undefined) {
      where.isPinned = params.pinned === 'true';
    }

    return this.prisma.note.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      include: { notifications: true },
    });
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

  create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const content = dto.content ?? '';
    return this.prisma.note.create({
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
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findById(userId, id);
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
