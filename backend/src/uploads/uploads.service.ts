import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadedImage {
  url: string;
  thumbUrl: string;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsDir: string;
  private readonly baseUrl: string;
  private readonly maxBytes: number;

  constructor(config: ConfigService) {
    this.uploadsDir = config.get<string>('UPLOADS_DIR', './uploads');
    this.baseUrl = config.get<string>('UPLOADS_BASE_URL', '/uploads');
    this.maxBytes = Number(config.get<number | string>('UPLOADS_MAX_BYTES', 5_242_880));
  }

  async process(file: Express.Multer.File, userId: string): Promise<UploadedImage> {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (file.size > this.maxBytes) {
      throw new BadRequestException(`Tamaño máximo ${this.maxBytes} bytes`);
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Tipo no permitido: ${file.mimetype}`);
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

    return {
      url: `${this.baseUrl}/${userId}/${id}.webp`,
      thumbUrl: `${this.baseUrl}/${userId}/${id}-thumb.webp`,
    };
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
      this.logger.warn(`No se pudo eliminar archivo ${fullPath}: ${(err as Error).message}`);
    }
  }
}
