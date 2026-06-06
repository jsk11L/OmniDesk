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
