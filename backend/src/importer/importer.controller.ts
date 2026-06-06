import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { ImporterService, type ImportReport } from './importer.service';

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
}
