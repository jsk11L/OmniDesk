import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  BudgetPeriod,
  CalendarBorderStyle,
  CalendarSize,
  FinanceCategoryType,
  GoalPeriod,
  HabitEntryStatus,
  ListFieldType,
  ListViewType,
  NotificationChannel,
  NotificationTrigger,
  SortDirection,
  TodoPriority,
  WishlistPriority,
} from '@prisma/client';
import AdmZip from 'adm-zip';
import { basename, dirname, extname } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { markdownToTiptap } from '../common/tiptap-markdown';

export type ImportMode = 'replace' | 'merge';

export interface ImportOwnReport {
  mode: ImportMode;
  counts: Record<string, number>;
}

type Json = Prisma.InputJsonValue;

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB (D-024)
const IGNORE = /(^|\/)\.(obsidian|git|trash)(\/|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export interface ImportReport {
  notesCreated: number;
  assetsUploaded: number;
  wikilinksResolved: number;
  wikilinksUnresolved: number;
  duplicateTitlesRenamed: number;
  skipped: string[];
  errors: string[];
}

@Injectable()
export class ImporterService {
  private readonly logger = new Logger(ImporterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async importObsidian(userId: string, buffer: Buffer): Promise<ImportReport> {
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Vault exceeds the 200 MB limit. Split it and import in parts.');
    }
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Could not read the zip file');
    }

    const report: ImportReport = {
      notesCreated: 0,
      assetsUploaded: 0,
      wikilinksResolved: 0,
      wikilinksUnresolved: 0,
      duplicateTitlesRenamed: 0,
      skipped: [],
      errors: [],
    };

    const entries = zip.getEntries().filter((e) => !e.isDirectory && !IGNORE.test(e.entryName));

    // 1) Assets → uploaded images, mapped by basename.
    const assetUrls = new Map<string, string>();
    for (const e of entries) {
      const name = e.entryName;
      if (name.toLowerCase().endsWith('.md')) continue;
      if (!IMAGE_EXT.test(name)) {
        report.skipped.push(name);
        continue;
      }
      try {
        const data = e.getData();
        const file = {
          buffer: data,
          mimetype: MIME[extname(name).toLowerCase()] ?? 'image/png',
          originalname: basename(name),
          size: data.length,
        } as Express.Multer.File;
        const { url } = await this.uploads.process(file, userId);
        assetUrls.set(basename(name).toLowerCase(), url);
        report.assetsUploaded++;
      } catch (err) {
        report.skipped.push(name);
        this.logger.warn(`Asset skipped (${name}): ${(err as Error).message}`);
      }
    }

    // 2) Pre-walk notes: assign deduped titles + create placeholders so
    //    wikilinks can resolve to real ids.
    const mdEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.md'));
    const titleToId = new Map<string, string>();
    const created: { id: string; body: string }[] = [];
    const usedTitles = new Set<string>();

    for (const e of mdEntries) {
      try {
        const text = e.getData().toString('utf8');
        const { frontmatter, body } = parseFrontmatter(text);
        const originalTitle = (frontmatter.title || basename(e.entryName, '.md')).trim() || 'Untitled';

        let title = originalTitle;
        let n = 2;
        while (usedTitles.has(title.toLowerCase())) {
          title = `${originalTitle} (${n++})`;
          report.duplicateTitlesRenamed++;
        }
        usedTitles.add(title.toLowerCase());

        const dir = dirname(e.entryName);
        const folderTags = dir && dir !== '.' ? dir.split('/').filter(Boolean) : [];
        const tags = [...new Set([...frontmatter.tags, ...folderTags])];

        const note = await this.prisma.note.create({
          data: {
            userId,
            title,
            content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
            tags,
            plainText: '',
          },
        });
        titleToId.set(title.toLowerCase(), note.id);
        titleToId.set(originalTitle.toLowerCase(), note.id);
        created.push({ id: note.id, body });
        report.notesCreated++;
      } catch (err) {
        report.errors.push(`${e.entryName}: ${(err as Error).message}`);
      }
    }

    // 3) Resolve links/embeds and convert Markdown → TipTap.
    for (const c of created) {
      try {
        const pre = this.preprocess(c.body, assetUrls, titleToId, report);
        const doc = markdownToTiptap(pre);
        await this.prisma.note.update({
          where: { id: c.id },
          data: { content: JSON.stringify(doc), plainText: stripMd(pre).slice(0, 10_000) },
        });
      } catch (err) {
        report.errors.push(`note ${c.id}: ${(err as Error).message}`);
      }
    }

    return report;
  }

  // ─── Import from an OmniDesk export (Block 5b, D-021) ─────

  async importOwnExport(userId: string, buffer: Buffer, mode: ImportMode): Promise<ImportOwnReport> {
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Could not read the zip file');
    }
    const dataEntry = zip.getEntry('data.json');
    if (!dataEntry) throw new BadRequestException('Not an OmniDesk export (data.json missing)');

    let data: ExportData;
    try {
      data = JSON.parse(dataEntry.getData().toString('utf8')) as ExportData;
    } catch {
      throw new BadRequestException('Corrupt data.json');
    }

    if (mode === 'replace') await this.wipeUserData(userId);
    const sfx = mode === 'merge' ? ' (imported)' : '';
    const counts: Record<string, number> = {};
    const bump = (k: string, n = 1) => (counts[k] = (counts[k] ?? 0) + n);

    // Notes
    for (const n of data.notes ?? []) {
      await this.prisma.note.create({
        data: {
          userId,
          title: (n.title ?? 'Untitled') + sfx,
          content: n.content ?? '',
          description: n.description ?? null,
          icon: n.icon ?? null,
          coverImageUrl: n.coverImageUrl ?? null,
          isPinned: n.isPinned ?? false,
          tags: n.tags ?? [],
          plainText: n.plainText ?? null,
        },
      });
      bump('notes');
    }

    // Lists (+ fields, tags, items with remapped customFields/tags)
    for (const l of data.lists ?? []) {
      const list = await this.prisma.list.create({
        data: {
          userId,
          name: (l.name ?? 'List') + sfx,
          description: l.description ?? null,
          icon: l.icon ?? null,
          coverImageUrl: l.coverImageUrl ?? null,
          defaultView: l.defaultView,
          defaultSortField: l.defaultSortField ?? null,
          defaultSortDir: l.defaultSortDir,
          gridConfig: (l.gridConfig ?? {}) as Json,
          viewConfig: (l.viewConfig ?? {}) as Json,
        },
      });
      bump('lists');
      const fieldMap: Record<string, string> = {};
      for (const f of l.fields ?? []) {
        const nf = await this.prisma.listField.create({
          data: {
            listId: list.id,
            name: f.name,
            fieldType: f.fieldType,
            isRequired: f.isRequired ?? false,
            position: f.position ?? 0,
            options: f.options == null ? Prisma.JsonNull : (f.options as Json),
            defaultValue: f.defaultValue ?? null,
          },
        });
        fieldMap[f.id] = nf.id;
      }
      const tagMap: Record<string, string> = {};
      for (const t of l.tags ?? []) {
        const nt = await this.prisma.listTag.create({
          data: { listId: list.id, name: t.name, color: t.color },
        });
        tagMap[t.id] = nt.id;
      }
      for (const it of l.items ?? []) {
        const item = await this.prisma.listItem.create({
          data: {
            listId: list.id,
            title: it.title,
            customFields: remapKeys(it.customFields, fieldMap),
            position: it.position ?? 0,
          },
        });
        bump('listItems');
        for (const lt of it.tags ?? []) {
          const tagId = tagMap[lt.tagId];
          if (tagId) await this.prisma.listItemTag.create({ data: { itemId: item.id, tagId } });
        }
      }
    }

    // Calendar
    for (const e of data.calendarEvents ?? []) {
      await this.prisma.calendarEvent.create({
        data: {
          userId,
          title: e.title,
          description: e.description ?? null,
          startDate: e.startDate,
          endDate: e.endDate,
          allDay: e.allDay ?? false,
          color: e.color,
          location: e.location ?? null,
        },
      });
      bump('events');
    }
    if (data.calendarSettings && mode === 'replace') {
      const cs = data.calendarSettings;
      await this.prisma.calendarSettings.create({
        data: { userId, size: cs.size, borderStyle: cs.borderStyle, firstDay: cs.firstDay, defaultView: cs.defaultView },
      });
    }

    // Todos
    for (const b of data.todoBoards ?? []) {
      const board = await this.prisma.todoBoard.create({
        data: { userId, name: (b.name ?? 'Board') + sfx, isDefault: false, isSystem: false },
      });
      bump('todoBoards');
      for (const col of b.columns ?? []) {
        const column = await this.prisma.todoColumn.create({
          data: {
            boardId: board.id,
            name: col.name,
            color: col.color,
            position: col.position ?? 0,
            isCompletionColumn: col.isCompletionColumn ?? false,
          },
        });
        for (const it of col.items ?? []) {
          await this.prisma.todoItem.create({
            data: {
              columnId: column.id,
              title: it.title,
              description: it.description ?? null,
              dueDate: it.dueDate ?? null,
              hasDueDate: it.hasDueDate ?? false,
              priority: it.priority,
              hasPriority: it.hasPriority ?? false,
              tags: it.tags ?? [],
              position: it.position ?? 0,
            },
          });
          bump('todoItems');
        }
      }
    }

    // Habits
    for (const h of data.habits ?? []) {
      const habit = await this.prisma.habit.create({
        data: {
          userId,
          name: (h.name ?? 'Habit') + sfx,
          description: h.description ?? null,
          icon: h.icon ?? null,
          color: h.color,
          activeDays: h.activeDays ?? [],
          weeklyGoal: h.weeklyGoal ?? null,
          goalPeriod: h.goalPeriod ?? null,
          goalTarget: h.goalTarget ?? null,
        },
      });
      bump('habits');
      for (const en of h.entries ?? []) {
        await this.prisma.habitEntry.create({
          data: { habitId: habit.id, date: en.date, status: en.status, notes: en.notes ?? null },
        });
      }
    }

    // Finance
    for (const fb of data.financeBoards ?? []) {
      const board = await this.prisma.financeBoard.create({
        data: { userId, name: (fb.name ?? 'Finance') + sfx, currency: fb.currency, isDefault: false },
      });
      bump('financeBoards');
      const catMap: Record<string, string> = {};
      for (const c of fb.categories ?? []) {
        const nc = await this.prisma.financeCategory.create({
          data: { boardId: board.id, name: c.name, color: c.color, icon: c.icon ?? null, categoryType: c.categoryType },
        });
        catMap[c.id] = nc.id;
      }
      for (const t of fb.transactions ?? []) {
        await this.prisma.transaction.create({
          data: {
            boardId: board.id,
            categoryId: t.categoryId ? (catMap[t.categoryId] ?? null) : null,
            title: t.title,
            amount: t.amount,
            type: t.type,
            date: t.date,
            notes: t.notes ?? null,
            tags: t.tags ?? [],
          },
        });
      }
      for (const bu of fb.budgets ?? []) {
        await this.prisma.budget.create({
          data: {
            boardId: board.id,
            categoryId: bu.categoryId ? (catMap[bu.categoryId] ?? null) : null,
            name: bu.name,
            amount: bu.amount,
            period: bu.period,
          },
        });
      }
      for (const w of fb.wishlistItems ?? []) {
        await this.prisma.wishlistItem.create({
          data: {
            boardId: board.id,
            title: w.title,
            description: w.description ?? null,
            imageUrl: w.imageUrl ?? null,
            estimatedPrice: w.estimatedPrice ?? null,
            currency: w.currency,
            url: w.url ?? null,
            category: w.category ?? null,
            priority: w.priority,
            isArchived: w.isArchived ?? false,
          },
        });
      }
      for (const p of fb.plannedPurchases ?? []) {
        await this.prisma.plannedPurchase.create({
          data: {
            boardId: board.id,
            categoryId: p.categoryId ? (catMap[p.categoryId] ?? null) : null,
            title: p.title,
            amount: p.amount,
            currency: p.currency,
            targetDate: p.targetDate,
            isPurchased: p.isPurchased ?? false,
            purchasedAt: p.purchasedAt ?? null,
            notes: p.notes ?? null,
          },
        });
      }
      for (const g of fb.savingsGoals ?? []) {
        const goal = await this.prisma.savingsGoal.create({
          data: {
            boardId: board.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount ?? 0,
            currency: g.currency,
            targetDate: g.targetDate ?? null,
            icon: g.icon ?? null,
            color: g.color,
            isCompleted: g.isCompleted ?? false,
            completedAt: g.completedAt ?? null,
          },
        });
        for (const c of g.contributions ?? []) {
          await this.prisma.savingsContribution.create({
            data: { goalId: goal.id, amount: c.amount, date: c.date, notes: c.notes ?? null },
          });
        }
      }
    }

    // Themes (flat scalar palette — spread minus identity fields)
    for (const th of data.themes ?? []) {
      const { id, userId: _u, createdAt, updatedAt, isDefault, name, ...palette } = th as Record<string, unknown> & {
        name: string;
      };
      void id;
      void _u;
      void createdAt;
      void updatedAt;
      void isDefault;
      await this.prisma.theme.create({
        data: { userId, name: name + sfx, isDefault: false, ...(palette as object) } as Prisma.ThemeUncheckedCreateInput,
      });
      bump('themes');
    }

    // Notifications
    for (const n of data.notifications ?? []) {
      await this.prisma.notificationConfig.create({
        data: {
          userId,
          title: n.title,
          message: n.message,
          iconUrl: n.iconUrl ?? null,
          accentColor: n.accentColor,
          triggerType: n.triggerType,
          scheduledAt: n.scheduledAt ?? null,
          recurringRule: n.recurringRule ?? null,
          isRecurring: n.isRecurring ?? false,
          channels: n.channels ?? [],
          isActive: n.isActive ?? true,
        },
      });
      bump('notifications');
    }

    return { mode, counts };
  }

  private async wipeUserData(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.note.deleteMany({ where: { userId } }),
      this.prisma.list.deleteMany({ where: { userId } }),
      this.prisma.calendarEvent.deleteMany({ where: { userId } }),
      this.prisma.calendarSettings.deleteMany({ where: { userId } }),
      this.prisma.todoBoard.deleteMany({ where: { userId } }),
      this.prisma.habit.deleteMany({ where: { userId } }),
      this.prisma.financeBoard.deleteMany({ where: { userId } }),
      this.prisma.notificationConfig.deleteMany({ where: { userId } }),
    ]);
    // Themes are referenced by User.activeThemeId — clear it first.
    await this.prisma.user.update({ where: { id: userId }, data: { activeThemeId: null } });
    await this.prisma.theme.deleteMany({ where: { userId } });
  }

  private preprocess(
    md: string,
    assets: Map<string, string>,
    titles: Map<string, string>,
    report: ImportReport,
  ): string {
    // Embeds first: ![[asset]] → image, ![[Note]] → link.
    let out = md.replace(/!\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
      const name = inner.split('|')[0].trim();
      const assetUrl = assets.get(basename(name).toLowerCase());
      if (assetUrl) return `![${name}](${assetUrl})`;
      const id = titles.get(name.toLowerCase());
      if (id) {
        report.wikilinksResolved++;
        return `[${name}](/app/notes?note=${id})`;
      }
      report.wikilinksUnresolved++;
      return name;
    });

    // Wikilinks: [[Target|alias]] → link or plain text.
    out = out.replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
      const [target, alias] = inner.split('|').map((s) => s.trim());
      const id = titles.get(target.toLowerCase());
      if (id) {
        report.wikilinksResolved++;
        return `[${alias || target}](/app/notes?note=${id})`;
      }
      report.wikilinksUnresolved++;
      return `[[${inner}]]`;
    });

    return out;
  }
}

interface Frontmatter {
  title?: string;
  tags: string[];
}

function parseFrontmatter(text: string): { frontmatter: Frontmatter; body: string } {
  const fm: Frontmatter = { tags: [] };
  if (!text.startsWith('---')) return { frontmatter: fm, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: fm, body: text };
  const block = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s*\n/, '');

  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'title') {
      fm.title = value.replace(/^["']|["']$/g, '');
    } else if (key === 'tags') {
      if (value.startsWith('[')) {
        fm.tags = value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((t) => t.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if (value) {
        fm.tags = value.split(/[\s,]+/).filter(Boolean);
      } else {
        // YAML list on following lines.
        for (let j = i + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) {
          fm.tags.push(lines[j].replace(/^\s*-\s+/, '').trim());
        }
      }
    }
  }
  return { frontmatter: fm, body };
}

interface ExportData {
  notes?: NoteRow[];
  lists?: ListRow[];
  calendarEvents?: CalRow[];
  calendarSettings?: CalSettingsRow | null;
  todoBoards?: TodoBoardRow[];
  habits?: HabitRow[];
  financeBoards?: FinanceBoardRow[];
  themes?: Record<string, unknown>[];
  notifications?: NotifRow[];
}

type NoteRow = { title?: string; content?: string | null; description?: string | null; icon?: string | null; coverImageUrl?: string | null; isPinned?: boolean; tags?: string[]; plainText?: string | null };
type ListFieldRow = { id: string; name: string; fieldType: ListFieldType; isRequired?: boolean; position?: number; options?: unknown; defaultValue?: string | null };
type ListTagRow = { id: string; name: string; color: string };
type ListItemRow = { title: string; customFields?: unknown; position?: number; tags?: { tagId: string }[] };
type ListRow = { name?: string; description?: string | null; icon?: string | null; coverImageUrl?: string | null; defaultView: ListViewType; defaultSortField?: string | null; defaultSortDir: SortDirection; gridConfig?: unknown; viewConfig?: unknown; fields?: ListFieldRow[]; tags?: ListTagRow[]; items?: ListItemRow[] };
type CalRow = { title: string; description?: string | null; startDate: string; endDate: string; allDay?: boolean; color: string; location?: string | null };
type CalSettingsRow = { size: CalendarSize; borderStyle: CalendarBorderStyle; firstDay: number; defaultView: string };
type TodoItemRow = { title: string; description?: string | null; dueDate?: string | null; hasDueDate?: boolean; priority: TodoPriority; hasPriority?: boolean; tags?: string[]; position?: number };
type TodoColRow = { name: string; color: string; position?: number; isCompletionColumn?: boolean; items?: TodoItemRow[] };
type TodoBoardRow = { name?: string; columns?: TodoColRow[] };
type HabitEntryRow = { date: string; status: HabitEntryStatus; notes?: string | null };
type HabitRow = { name?: string; description?: string | null; icon?: string | null; color: string; activeDays?: number[]; weeklyGoal?: number | null; goalPeriod?: GoalPeriod | null; goalTarget?: number | null; entries?: HabitEntryRow[] };
type CatRow = { id: string; name: string; color: string; icon?: string | null; categoryType: FinanceCategoryType };
type TxRow = { categoryId?: string | null; title: string; amount: number; type: FinanceCategoryType; date: string; notes?: string | null; tags?: string[] };
type BudgetRow = { categoryId?: string | null; name: string; amount: number; period: BudgetPeriod };
type WishRow = { title: string; description?: string | null; imageUrl?: string | null; estimatedPrice?: number | null; currency: string; url?: string | null; category?: string | null; priority: WishlistPriority; isArchived?: boolean };
type PlannedRow = { categoryId?: string | null; title: string; amount: number; currency: string; targetDate: string; isPurchased?: boolean; purchasedAt?: string | null; notes?: string | null };
type ContribRow = { amount: number; date: string; notes?: string | null };
type GoalRow = { name: string; targetAmount: number; currentAmount?: number; currency: string; targetDate?: string | null; icon?: string | null; color: string; isCompleted?: boolean; completedAt?: string | null; contributions?: ContribRow[] };
type FinanceBoardRow = { name?: string; currency: string; categories?: CatRow[]; transactions?: TxRow[]; budgets?: BudgetRow[]; wishlistItems?: WishRow[]; plannedPurchases?: PlannedRow[]; savingsGoals?: GoalRow[] };
type NotifRow = { title: string; message: string; iconUrl?: string | null; accentColor: string; triggerType: NotificationTrigger; scheduledAt?: string | null; recurringRule?: string | null; isRecurring?: boolean; channels?: NotificationChannel[]; isActive?: boolean };

function remapKeys(obj: unknown, map: Record<string, string>): Json {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) out[map[k] ?? k] = v;
  return out as Json;
}

function stripMd(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
