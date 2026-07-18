import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  // Anti-abuse: cap upload bursts (in addition to the per-user storage quota).
  @Throttle({ default: { limit: 40, ttl: 15 * 60 * 1000 } })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.process(file, user.id);
    return { data };
  }

  @Get('usage')
  async usage(@CurrentUser() user: AuthUser) {
    return { data: await this.service.usage(user.id) };
  }

  @Get('storage')
  async storage(@CurrentUser() user: AuthUser) {
    return { data: await this.service.storage(user.id) };
  }
}
