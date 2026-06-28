import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AdmZip from 'adm-zip';
import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { tiptapToMarkdown } from '../common/tiptap-markdown';

export const EXPORT_VERSION = 1;

@Injectable()
export class ExporterService {
  private readonly uploadsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const dir = config.get<string>('UPLOADS_DIR', './uploads');
    this.uploadsDir = isAbsolute(dir) ? dir : join(process.cwd(), dir);
  }

  /** Gather every entity the user owns into a serialisable object. */
  private async collect(userId: string) {
    const [notes, lists, calendarEvents, calendarSettings, todoBoards, habits, financeBoards, themes, notifications] =
      await Promise.all([
        this.prisma.note.findMany({ where: { userId } }),
        this.prisma.list.findMany({
          where: { userId },
          include: { fields: true, tags: true, items: { include: { tags: true } } },
        }),
        this.prisma.calendarEvent.findMany({ where: { userId } }),
        this.prisma.calendarSettings.findUnique({ where: { userId } }),
        this.prisma.todoBoard.findMany({
          where: { userId },
          include: { columns: { include: { items: true } } },
        }),
        this.prisma.habit.findMany({ where: { userId }, include: { entries: true } }),
        this.prisma.financeBoard.findMany({
          where: { userId },
          include: {
            categories: true,
            transactions: true,
            budgets: true,
            wishlistItems: true,
            plannedPurchases: true,
            savingsGoals: { include: { contributions: true } },
          },
        }),
        this.prisma.theme.findMany({ where: { userId } }),
        this.prisma.notificationConfig.findMany({ where: { userId } }),
      ]);

    return { notes, lists, calendarEvents, calendarSettings, todoBoards, habits, financeBoards, themes, notifications };
  }

  async exportAll(userId: string): Promise<{ buffer: Buffer; filename: string }> {
    const data = await this.collect(userId);
    const zip = new AdmZip();

    const manifest = {
      exportVersion: EXPORT_VERSION,
      app: 'OmniDesk',
      exportedAt: new Date().toISOString(),
      counts: {
        notes: data.notes.length,
        lists: data.lists.length,
        calendarEvents: data.calendarEvents.length,
        todoBoards: data.todoBoards.length,
        habits: data.habits.length,
        financeBoards: data.financeBoards.length,
        themes: data.themes.length,
        notifications: data.notifications.length,
      },
    };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
    zip.addFile('data.json', Buffer.from(JSON.stringify(data, null, 2)));

    // One Markdown file per note (D-022).
    const usedNames = new Set<string>();
    for (const note of data.notes) {
      let base = slugify(note.title || 'untitled');
      let name = `${base}.md`;
      let n = 2;
      while (usedNames.has(name)) name = `${base}-${n++}.md`;
      usedNames.add(name);
      zip.addFile(`notes-markdown/${name}`, Buffer.from(this.noteToMarkdown(note)));
    }

    // The user's uploaded files.
    const userUploads = join(this.uploadsDir, userId);
    if (existsSync(userUploads)) {
      zip.addLocalFolder(userUploads, 'uploads');
    }

    return { buffer: zip.toBuffer(), filename: `omnidesk-export-${new Date().toISOString().slice(0, 10)}.zip` };
  }

  noteToMarkdown(note: { title: string; content: string | null; tags?: string[]; createdAt?: Date; updatedAt?: Date }): string {
    const fm: string[] = ['---', `title: ${JSON.stringify(note.title || 'Untitled')}`];
    if (note.tags?.length) fm.push(`tags: [${note.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
    if (note.createdAt) fm.push(`created: ${new Date(note.createdAt).toISOString()}`);
    if (note.updatedAt) fm.push(`updated: ${new Date(note.updatedAt).toISOString()}`);
    fm.push('---', '');
    return fm.join('\n') + tiptapToMarkdown(note.content);
  }

  async noteMarkdownById(userId: string, noteId: string): Promise<{ markdown: string; filename: string }> {
    const note = await this.prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return { markdown: this.noteToMarkdown(note), filename: `${slugify(note.title || 'untitled')}.md` };
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'untitled'
  );
}
