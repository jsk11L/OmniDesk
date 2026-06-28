import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import {
  ImporterService,
  type FieldOverrideInput,
  type ImportAnalysis,
  type ImportListReport,
  type ImportMode,
  type ImportOwnReport,
  type ImportReport,
} from './importer.service';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImporterController {
  constructor(private readonly importer: ImporterService) {}

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('obsidian')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async obsidian(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ): Promise<ImportReport> {
    if (!file) throw new BadRequestException('A vault .zip file is required');
    return this.importer.importObsidian(user.id, file.buffer);
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @Post('obsidian-list/analyze')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async analyzeObsidianList(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() _user: AuthUser,
  ): Promise<ImportAnalysis> {
    if (!file) throw new BadRequestException('A vault .zip file is required');
    return this.importer.analyzeObsidianVault(file.buffer);
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('obsidian-list')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async obsidianToList(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
    @Query('listId') listId?: string,
    @Query('name') name?: string,
    @Body('config') config?: string,
  ): Promise<ImportListReport> {
    if (!file) throw new BadRequestException('A vault .zip file is required');
    let parsed: { listId?: string; name?: string; fields?: FieldOverrideInput[] } = {};
    if (config) {
      try {
        parsed = JSON.parse(config) as typeof parsed;
      } catch {
        throw new BadRequestException('Invalid import config');
      }
    }
    return this.importer.importObsidianToList(user.id, file.buffer, {
      listId: parsed.listId ?? listId,
      listName: parsed.name ?? name,
      fields: parsed.fields,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('omnidesk')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async omnidesk(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
    @Query('mode') mode?: string,
  ): Promise<ImportOwnReport> {
    if (!file) throw new BadRequestException('An OmniDesk export .zip is required');
    const resolved: ImportMode = mode === 'replace' ? 'replace' : 'merge';
    return this.importer.importOwnExport(user.id, file.buffer, resolved);
  }
}
