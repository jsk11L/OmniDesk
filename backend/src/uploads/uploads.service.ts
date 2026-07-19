import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

export interface UploadedImage {
  url: string;
  thumbUrl: string;
}

export interface UploadUsage {
  used: number;
  quota: number;
  percent: number;
}

export interface StorageBreakdownItem {
  module: string;
  count: number;
  bytes: number;
}

export interface StorageInfo {
  uploads: UploadUsage;
  data: { total: number; breakdown: StorageBreakdownItem[] };
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsDir: string;
  private readonly baseUrl: string;
  private readonly maxBytes: number;
  private readonly quotaBytes: number;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.uploadsDir = config.get<string>('UPLOADS_DIR', './uploads');
    this.baseUrl = config.get<string>('UPLOADS_BASE_URL', '/uploads');
    this.maxBytes = Number(config.get<number | string>('UPLOADS_MAX_BYTES', 5_242_880));
    this.quotaBytes = Number(
      config.get<number | string>('UPLOADS_QUOTA_PER_USER_BYTES', 524_288_000),
    );
  }

  async process(file: Express.Multer.File, userId: string): Promise<UploadedImage> {
    if (!file) throw new BadRequestException('File required');
    if (file.size > this.maxBytes) {
      throw new BadRequestException(`Maximum size ${this.maxBytes} bytes`);
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
    }

    // Quota pre-check (conservative: source size is an upper bound on the
    // stored WebP). Blocks before doing any disk work.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { uploadBytesUsed: true },
    });
    const used = user ? Number(user.uploadBytesUsed) : 0;
    if (used + file.size > this.quotaBytes) {
      throw new ForbiddenException('Storage quota exceeded. Delete some images to free up space.');
    }

    const userDir = join(this.uploadsDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const id = randomUUID();
    const mainPath = join(userDir, `${id}.webp`);
    const thumbPath = join(userDir, `${id}-thumb.webp`);

    await sharp(file.buffer)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(mainPath);

    await sharp(file.buffer)
      .rotate()
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    // Account the actual bytes written toward the quota.
    const written = (await this.fileSize(mainPath)) + (await this.fileSize(thumbPath));
    await this.prisma.user.update({
      where: { id: userId },
      data: { uploadBytesUsed: { increment: BigInt(written) } },
    });

    return {
      url: `${this.baseUrl}/${userId}/${id}.webp`,
      thumbUrl: `${this.baseUrl}/${userId}/${id}-thumb.webp`,
    };
  }

  async usage(userId: string): Promise<UploadUsage> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { uploadBytesUsed: true },
    });
    const used = user ? Number(user.uploadBytesUsed) : 0;
    return {
      used,
      quota: this.quotaBytes,
      percent: this.quotaBytes > 0 ? Math.min(100, Math.round((used / this.quotaBytes) * 100)) : 0,
    };
  }

  /** Uploaded-file quota + the byte footprint of the user's DB data, per module. */
  async storage(userId: string): Promise<StorageInfo> {
    const [uploads, data] = await Promise.all([this.usage(userId), this.dataUsage(userId)]);
    return { uploads, data };
  }

  /**
   * Estimated bytes of the user's actual content (text + JSON), grouped by
   * module. Aggregated IN SQL (octet_length sums) — the previous version
   * loaded every note/item body into Node memory just to measure it.
   */
  private async dataUsage(
    userId: string,
  ): Promise<{ total: number; breakdown: StorageBreakdownItem[] }> {
    type Agg = { count: bigint; bytes: bigint };
    const one = (rows: Agg[]): { count: number; bytes: number } => ({
      count: Number(rows[0]?.count ?? 0),
      bytes: Number(rows[0]?.bytes ?? 0),
    });

    const [notes, listItems, events, todoItems, habits, habitEntries, transactions] =
      await Promise.all([
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(title) + octet_length(coalesce(content,'')) + octet_length(coalesce("plainText",''))), 0) AS bytes
          FROM "Note" WHERE "userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(i.title) + octet_length(coalesce(i."customFields"::text,''))), 0) AS bytes
          FROM "ListItem" i JOIN "List" l ON l.id = i."listId" WHERE l."userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(title) + octet_length(coalesce(description,'')) + octet_length(coalesce(location,''))), 0) AS bytes
          FROM "CalendarEvent" WHERE "userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(t.title) + octet_length(coalesce(t.description,''))), 0) AS bytes
          FROM "TodoItem" t
          JOIN "TodoColumn" c ON c.id = t."columnId"
          JOIN "TodoBoard" b ON b.id = c."boardId"
          WHERE b."userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(name) + octet_length(coalesce(description,''))), 0) AS bytes
          FROM "Habit" WHERE "userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(coalesce(e.notes,''))), 0) AS bytes
          FROM "HabitEntry" e JOIN "Habit" h ON h.id = e."habitId" WHERE h."userId" = ${userId}`,
        this.prisma.$queryRaw<Agg[]>`
          SELECT COUNT(*) AS count,
                 COALESCE(SUM(octet_length(tr.title) + octet_length(coalesce(tr.notes,''))), 0) AS bytes
          FROM "Transaction" tr JOIN "FinanceBoard" fb ON fb.id = tr."boardId" WHERE fb."userId" = ${userId}`,
      ]);

    const n = one(notes);
    const li = one(listItems);
    const ev = one(events);
    const td = one(todoItems);
    const h = one(habits);
    const he = one(habitEntries);
    const tr = one(transactions);

    const breakdown: StorageBreakdownItem[] = [
      { module: 'Notes', count: n.count, bytes: n.bytes },
      { module: 'List items', count: li.count, bytes: li.bytes },
      { module: 'Calendar', count: ev.count, bytes: ev.bytes },
      { module: 'To-Do', count: td.count, bytes: td.bytes },
      { module: 'Habits', count: h.count + he.count, bytes: h.bytes + he.bytes },
      { module: 'Finance', count: tr.count, bytes: tr.bytes },
    ];
    const total = breakdown.reduce((s, x) => s + x.bytes, 0);
    return { total, breakdown };
  }

  private async fileSize(path: string): Promise<number> {
    try {
      return (await fs.stat(path)).size;
    } catch {
      return 0;
    }
  }

  /** Monthly reconciliation of every user's uploadBytesUsed against disk. */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async recalculateAllUsage(): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.uploadsDir);
    } catch {
      return; // uploads dir not created yet
    }
    for (const userId of entries) {
      const dir = join(this.uploadsDir, userId);
      try {
        if (!(await fs.stat(dir)).isDirectory()) continue;
        const files = await fs.readdir(dir);
        let total = 0;
        for (const f of files) total += await this.fileSize(join(dir, f));
        await this.prisma.user
          .update({ where: { id: userId }, data: { uploadBytesUsed: BigInt(total) } })
          .catch(() => undefined); // directory without a matching user row
      } catch (err) {
        this.logger.warn(`Usage recalc failed for ${userId}: ${(err as Error).message}`);
      }
    }
    this.logger.log('Recalculated per-user upload usage from disk');
  }

  async delete(relativeUrl: string | null | undefined): Promise<void> {
    if (!relativeUrl || !relativeUrl.startsWith(this.baseUrl)) return;
    const fileName = relativeUrl.slice(this.baseUrl.length).replace(/^\/+/, '');
    const fullPath = join(this.uploadsDir, fileName);
    try {
      await fs.unlink(fullPath);
      const thumb = fullPath.replace(/\.webp$/, '-thumb.webp');
      await fs.unlink(thumb).catch(() => undefined);
    } catch (err) {
      this.logger.warn(`Could not delete file ${fullPath}: ${(err as Error).message}`);
    }
  }
}
