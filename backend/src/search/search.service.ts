import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type SearchType = 'note' | 'event' | 'list-item' | 'todo';

export interface SearchResult {
  type: SearchType;
  id: string;
  title: string;
  snippet: string;
  link: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, q: string, types?: SearchType[]): Promise<SearchResult[]> {
    const query = q.trim();
    if (query.length < 2) return [];
    const want = (t: SearchType) => !types || types.length === 0 || types.includes(t);
    const like = `%${query}%`;

    const tasks: Promise<SearchResult[]>[] = [];
    if (want('note')) tasks.push(this.notes(userId, query));
    if (want('event')) tasks.push(this.events(userId, like));
    if (want('list-item')) tasks.push(this.listItems(userId, like));
    if (want('todo')) tasks.push(this.todos(userId, like));

    const groups = await Promise.all(tasks);
    return groups.flat().slice(0, 50);
  }

  /** Full-text search over the derived plainText (uses the GIN index). */
  private async notes(userId: string, q: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<{ id: string; title: string; plainText: string | null }[]>(
      Prisma.sql`
        SELECT "id", "title", "plainText"
        FROM "Note"
        WHERE "userId" = ${userId}
          AND to_tsvector('english', coalesce("plainText", '') || ' ' || coalesce("title", ''))
              @@ plainto_tsquery('english', ${q})
        ORDER BY "updatedAt" DESC
        LIMIT 20
      `,
    );
    return rows.map((r) => ({
      type: 'note' as const,
      id: r.id,
      title: r.title || 'Untitled',
      snippet: snippet(r.plainText ?? '', q),
      link: `/app/notes?note=${r.id}`,
    }));
  }

  private async events(userId: string, like: string): Promise<SearchResult[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: like.slice(1, -1), mode: 'insensitive' } },
          { location: { contains: like.slice(1, -1), mode: 'insensitive' } },
        ],
      },
      orderBy: { startDate: 'desc' },
      take: 15,
      select: { id: true, title: true, location: true },
    });
    return rows.map((r) => ({
      type: 'event' as const,
      id: r.id,
      title: r.title,
      snippet: r.location ?? '',
      link: '/app/calendar',
    }));
  }

  private async listItems(userId: string, like: string): Promise<SearchResult[]> {
    const rows = await this.prisma.listItem.findMany({
      where: { list: { userId }, title: { contains: like.slice(1, -1), mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: { id: true, title: true, listId: true, list: { select: { name: true } } },
    });
    return rows.map((r) => ({
      type: 'list-item' as const,
      id: r.id,
      title: r.title,
      snippet: r.list.name,
      link: `/app/lists/${r.listId}`,
    }));
  }

  private async todos(userId: string, like: string): Promise<SearchResult[]> {
    const rows = await this.prisma.todoItem.findMany({
      where: { column: { board: { userId } }, title: { contains: like.slice(1, -1), mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: { id: true, title: true },
    });
    return rows.map((r) => ({
      type: 'todo' as const,
      id: r.id,
      title: r.title,
      snippet: '',
      link: '/app/todos',
    }));
  }
}

function snippet(text: string, q: string): string {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  return (start > 0 ? '…' : '') + text.slice(start, start + 120).trim() + '…';
}
