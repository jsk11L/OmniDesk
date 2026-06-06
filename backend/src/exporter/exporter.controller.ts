import { Controller, Get, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { ExporterService } from './exporter.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExporterController {
  constructor(private readonly exporter: ExporterService) {}

  // Anti-abuse: full export is heavy.
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('export/all')
  async exportAll(@CurrentUser() user: AuthUser, @Res() res: Response): Promise<void> {
    const { buffer, filename } = await this.exporter.exportAll(user.id);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
  }

  @Get('export/notes/:id/markdown')
  async noteMarkdown(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { markdown, filename } = await this.exporter.noteMarkdownById(user.id, id);
    res.set({
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(markdown);
  }
}
