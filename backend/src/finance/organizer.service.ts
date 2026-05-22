import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  PlannedPurchase,
  SavingsContribution,
  SavingsGoal,
  WishlistItem,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface WishlistInput {
  title: string;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  currency?: string;
  url?: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PlannedPurchaseInput {
  title: string;
  amount: number;
  currency?: string;
  targetDate: string;
  categoryId?: string;
  notes?: string;
}

export interface SavingsGoalInput {
  name: string;
  targetAmount: number;
  currency?: string;
  targetDate?: string;
  icon?: string;
  color?: string;
}

export interface ContributionInput {
  amount: number;
  notes?: string;
  date?: string;
}

@Injectable()
export class OrganizerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertBoardOwner(userId: string, boardId: string): Promise<void> {
    const board = await this.prisma.financeBoard.findFirst({ where: { id: boardId, userId } });
    if (!board) throw new NotFoundException('Board not found');
  }

  // ─── Wishlist ───────────────────────────────────────────────

  async listWishlist(userId: string, boardId: string): Promise<WishlistItem[]> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.wishlistItem.findMany({
      where: { boardId, isArchived: false },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createWishlist(userId: string, boardId: string, dto: WishlistInput): Promise<WishlistItem> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.wishlistItem.create({
      data: {
        boardId,
        title: dto.title,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        estimatedPrice: dto.estimatedPrice ?? null,
        currency: dto.currency ?? 'USD',
        url: dto.url ?? null,
        category: dto.category ?? null,
        priority: dto.priority ?? 'MEDIUM',
      },
    });
  }

  async updateWishlist(userId: string, id: string, dto: Partial<WishlistInput> & { isArchived?: boolean }): Promise<WishlistItem> {
    const item = await this.prisma.wishlistItem.findFirst({
      where: { id, board: { userId } },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');
    return this.prisma.wishlistItem.update({
      where: { id },
      data: {
        title: dto.title ?? item.title,
        description: dto.description ?? item.description,
        imageUrl: dto.imageUrl ?? item.imageUrl,
        estimatedPrice: dto.estimatedPrice ?? item.estimatedPrice,
        currency: dto.currency ?? item.currency,
        url: dto.url ?? item.url,
        category: dto.category ?? item.category,
        priority: dto.priority ?? item.priority,
        isArchived: dto.isArchived ?? item.isArchived,
      },
    });
  }

  async deleteWishlist(userId: string, id: string): Promise<{ id: string }> {
    const item = await this.prisma.wishlistItem.findFirst({
      where: { id, board: { userId } },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');
    await this.prisma.wishlistItem.delete({ where: { id } });
    return { id };
  }

  // ─── Planned Purchases ─────────────────────────────────────

  async listPlannedPurchases(userId: string, boardId: string): Promise<PlannedPurchase[]> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.plannedPurchase.findMany({
      where: { boardId },
      orderBy: [{ isPurchased: 'asc' }, { targetDate: 'asc' }],
    });
  }

  async createPlannedPurchase(userId: string, boardId: string, dto: PlannedPurchaseInput): Promise<PlannedPurchase> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.plannedPurchase.create({
      data: {
        boardId,
        title: dto.title,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        targetDate: new Date(dto.targetDate),
        categoryId: dto.categoryId ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async updatePlannedPurchase(
    userId: string,
    id: string,
    dto: Partial<PlannedPurchaseInput> & { isPurchased?: boolean; createTransaction?: boolean },
  ): Promise<PlannedPurchase> {
    const item = await this.prisma.plannedPurchase.findFirst({
      where: { id, board: { userId } },
    });
    if (!item) throw new NotFoundException('Planned purchase not found');

    const updated = await this.prisma.plannedPurchase.update({
      where: { id },
      data: {
        title: dto.title ?? item.title,
        amount: dto.amount ?? item.amount,
        currency: dto.currency ?? item.currency,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : item.targetDate,
        categoryId: dto.categoryId ?? item.categoryId,
        notes: dto.notes ?? item.notes,
        isPurchased: dto.isPurchased ?? item.isPurchased,
        purchasedAt: dto.isPurchased && !item.isPurchased ? new Date() : item.purchasedAt,
      },
    });

    if (dto.isPurchased && !item.isPurchased && dto.createTransaction) {
      await this.prisma.transaction.create({
        data: {
          boardId: item.boardId,
          title: updated.title,
          amount: updated.amount,
          type: 'EXPENSE',
          date: new Date(),
          categoryId: updated.categoryId,
          notes: 'Desde compras planificadas',
        },
      });
    }

    return updated;
  }

  async deletePlannedPurchase(userId: string, id: string): Promise<{ id: string }> {
    const item = await this.prisma.plannedPurchase.findFirst({
      where: { id, board: { userId } },
    });
    if (!item) throw new NotFoundException('Planned purchase not found');
    await this.prisma.plannedPurchase.delete({ where: { id } });
    return { id };
  }

  // ─── Savings Goals ─────────────────────────────────────────

  async listSavingsGoals(userId: string, boardId: string): Promise<SavingsGoal[]> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.savingsGoal.findMany({
      where: { boardId },
      orderBy: [{ isCompleted: 'asc' }, { targetDate: 'asc' }],
    });
  }

  async createSavingsGoal(userId: string, boardId: string, dto: SavingsGoalInput): Promise<SavingsGoal> {
    await this.assertBoardOwner(userId, boardId);
    if (dto.targetAmount <= 0) throw new BadRequestException('targetAmount must be > 0');
    return this.prisma.savingsGoal.create({
      data: {
        boardId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currency: dto.currency ?? 'USD',
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        icon: dto.icon ?? null,
        color: dto.color ?? '#22c55e',
      },
    });
  }

  async updateSavingsGoal(
    userId: string,
    id: string,
    dto: Partial<SavingsGoalInput>,
  ): Promise<SavingsGoal> {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, board: { userId } },
    });
    if (!goal) throw new NotFoundException('Savings goal not found');
    return this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: dto.name ?? goal.name,
        targetAmount: dto.targetAmount ?? goal.targetAmount,
        currency: dto.currency ?? goal.currency,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : goal.targetDate,
        icon: dto.icon ?? goal.icon,
        color: dto.color ?? goal.color,
      },
    });
  }

  async deleteSavingsGoal(userId: string, id: string): Promise<{ id: string }> {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, board: { userId } },
    });
    if (!goal) throw new NotFoundException('Savings goal not found');
    await this.prisma.savingsGoal.delete({ where: { id } });
    return { id };
  }

  async addContribution(
    userId: string,
    goalId: string,
    dto: ContributionInput,
  ): Promise<SavingsContribution> {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, board: { userId } },
    });
    if (!goal) throw new NotFoundException('Savings goal not found');
    if (dto.amount <= 0) throw new BadRequestException('amount must be > 0');

    const contribution = await this.prisma.savingsContribution.create({
      data: {
        goalId,
        amount: dto.amount,
        notes: dto.notes ?? null,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });

    const newAmount = goal.currentAmount + dto.amount;
    const isCompleted = newAmount >= goal.targetAmount;
    await this.prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? new Date() : goal.completedAt,
      },
    });

    return contribution;
  }

  async deleteContribution(userId: string, id: string): Promise<{ id: string }> {
    const contribution = await this.prisma.savingsContribution.findFirst({
      where: { id, goal: { board: { userId } } },
      include: { goal: true },
    });
    if (!contribution) throw new NotFoundException('Contribution not found');

    await this.prisma.savingsContribution.delete({ where: { id } });
    const newAmount = Math.max(0, contribution.goal.currentAmount - contribution.amount);
    await this.prisma.savingsGoal.update({
      where: { id: contribution.goalId },
      data: {
        currentAmount: newAmount,
        isCompleted: newAmount >= contribution.goal.targetAmount,
      },
    });
    return { id };
  }
}
