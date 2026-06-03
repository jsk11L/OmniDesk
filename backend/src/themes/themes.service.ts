import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Theme } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemesService {
  private readonly systemUserId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.systemUserId = config.get<string>(
      'SEED_SYSTEM_USER_ID',
      '00000000-0000-0000-0000-000000000001',
    );
  }

  listForUser(userId: string): Promise<Theme[]> {
    return this.prisma.theme.findMany({
      where: {
        OR: [
          { userId },
          { userId: this.systemUserId, isDefault: true },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(userId: string, id: string): Promise<Theme> {
    const theme = await this.prisma.theme.findUnique({ where: { id } });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    const isOwner = theme.userId === userId;
    const isVisibleSystem = theme.userId === this.systemUserId && theme.isDefault;
    if (!isOwner && !isVisibleSystem) {
      throw new NotFoundException('Theme not found');
    }
    return theme;
  }

  create(userId: string, dto: CreateThemeDto): Promise<Theme> {
    return this.prisma.theme.create({
      data: {
        userId,
        name: dto.name,
        isDefault: false,
        isDark: dto.isDark ?? true,
        ...this.colorOverrides(dto),
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateThemeDto): Promise<Theme> {
    const theme = await this.prisma.theme.findUnique({ where: { id } });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    // System themes are visible to every user (see findAll), so a read-only
    // attempt must report 403, not 404 — otherwise we'd deny the existence of
    // a theme the user can plainly see. Checked before ownership because system
    // themes belong to the system user, never the requester.
    if (theme.isDefault) {
      throw new ForbiddenException('System themes are read-only');
    }
    if (theme.userId !== userId) {
      throw new NotFoundException('Theme not found');
    }
    return this.prisma.theme.update({
      where: { id },
      data: {
        name: dto.name ?? theme.name,
        isDark: dto.isDark ?? theme.isDark,
        ...this.colorOverrides(dto),
      },
    });
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    const theme = await this.prisma.theme.findUnique({ where: { id } });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    if (theme.isDefault) {
      throw new ForbiddenException('System themes cannot be deleted');
    }
    if (theme.userId !== userId) {
      throw new NotFoundException('Theme not found');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { activeThemeId: id },
        data: { activeThemeId: null },
      });
      await tx.theme.delete({ where: { id } });
    });
    return { id };
  }

  async activate(userId: string, id: string): Promise<{ activeThemeId: string }> {
    await this.findById(userId, id);
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeThemeId: id },
    });
    return { activeThemeId: id };
  }

  private colorOverrides(dto: CreateThemeDto | UpdateThemeDto): Partial<Theme> {
    const data: Partial<Theme> = {};
    if (dto.colorPrimary !== undefined) data.colorPrimary = dto.colorPrimary;
    if (dto.colorSecondary !== undefined) data.colorSecondary = dto.colorSecondary;
    if (dto.colorBackground !== undefined) data.colorBackground = dto.colorBackground;
    if (dto.colorSurface !== undefined) data.colorSurface = dto.colorSurface;
    if (dto.colorSurfaceHover !== undefined) data.colorSurfaceHover = dto.colorSurfaceHover;
    if (dto.colorBorder !== undefined) data.colorBorder = dto.colorBorder;
    if (dto.colorText !== undefined) data.colorText = dto.colorText;
    if (dto.colorTextMuted !== undefined) data.colorTextMuted = dto.colorTextMuted;
    if (dto.colorAccent !== undefined) data.colorAccent = dto.colorAccent;
    if (dto.colorDanger !== undefined) data.colorDanger = dto.colorDanger;
    if (dto.colorSuccess !== undefined) data.colorSuccess = dto.colorSuccess;
    if (dto.fontFamily !== undefined) data.fontFamily = dto.fontFamily;
    if (dto.borderRadius !== undefined) data.borderRadius = dto.borderRadius;
    return data;
  }
}
