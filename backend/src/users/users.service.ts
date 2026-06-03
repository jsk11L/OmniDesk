import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const DEFAULT_THEME_ID = '11111111-1111-1111-1111-000000000001';

type PrismaLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName ?? user.displayName,
        avatarUrl: dto.avatarUrl ?? user.avatarUrl,
      },
    });
  }

  async seedDefaultsForNewUser(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client: PrismaLike = tx ?? this.prisma;

    const systemTheme = await client.theme.findUnique({ where: { id: DEFAULT_THEME_ID } });
    if (systemTheme) {
      await client.user.update({
        where: { id: userId },
        data: { activeThemeId: DEFAULT_THEME_ID },
      });
    } else {
      this.logger.warn(
        `Default system theme ${DEFAULT_THEME_ID} not found. Did you run \`pnpm db:seed\`?`,
      );
    }

    await client.todoBoard.create({
      data: {
        userId,
        name: 'Tablero Personal',
        isDefault: true,
        isSystem: true,
        columns: {
          create: [
            { name: 'Backlog', color: '#71717a', position: 0 },
            { name: 'En Progreso', color: '#3b82f6', position: 1 },
            { name: 'En Revisión', color: '#f59e0b', position: 2 },
            { name: 'Completado', color: '#22c55e', position: 3, isCompletionColumn: true },
          ],
        },
      },
    });

    await client.financeBoard.create({
      data: {
        userId,
        name: 'Finanzas Personales',
        currency: 'USD',
        isDefault: true,
        categories: {
          create: [
            { name: 'Salario', color: '#22c55e', categoryType: 'INCOME' },
            { name: 'Freelance', color: '#16a34a', categoryType: 'INCOME' },
            { name: 'Otros Ingresos', color: '#84cc16', categoryType: 'INCOME' },
            { name: 'Alimentación', color: '#f59e0b', categoryType: 'EXPENSE' },
            { name: 'Transporte', color: '#3b82f6', categoryType: 'EXPENSE' },
            { name: 'Vivienda', color: '#8b5cf6', categoryType: 'EXPENSE' },
            { name: 'Entretenimiento', color: '#ec4899', categoryType: 'EXPENSE' },
            { name: 'Salud', color: '#ef4444', categoryType: 'EXPENSE' },
            { name: 'Educación', color: '#06b6d4', categoryType: 'EXPENSE' },
            { name: 'Otros', color: '#94a3b8', categoryType: 'EXPENSE' },
          ],
        },
      },
    });

    this.logger.log(`Defaults seeded for user ${userId}`);
  }
}
