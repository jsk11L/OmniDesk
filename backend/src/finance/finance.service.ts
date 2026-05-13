import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Budget,
  FinanceBoard,
  FinanceCategory,
  FinanceCategoryType,
  Prisma,
  Transaction,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceBoardDto } from './dto/create-finance-board.dto';
import { UpdateFinanceBoardDto } from './dto/update-finance-board.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

export interface ListTransactionsParams {
  start?: string;
  end?: string;
  type?: string;
  category?: string;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  byCategory: CategorySummary[];
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Boards ──────────────────────────────────────────────

  listBoards(userId: string): Promise<FinanceBoard[]> {
    return this.prisma.financeBoard.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findBoardById(userId: string, id: string): Promise<FinanceBoard> {
    const board = await this.prisma.financeBoard.findFirst({
      where: { id, userId },
      include: {
        categories: { orderBy: { name: 'asc' } },
        budgets: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!board) {
      throw new NotFoundException('Finance board not found');
    }
    return board;
  }

  createBoard(userId: string, dto: CreateFinanceBoardDto): Promise<FinanceBoard> {
    return this.prisma.financeBoard.create({
      data: {
        userId,
        name: dto.name,
        currency: dto.currency ?? 'USD',
        isDefault: false,
      },
    });
  }

  async updateBoard(
    userId: string,
    id: string,
    dto: UpdateFinanceBoardDto,
  ): Promise<FinanceBoard> {
    const board = await this.assertBoardOwner(userId, id);
    return this.prisma.financeBoard.update({
      where: { id },
      data: {
        name: dto.name ?? board.name,
        currency: dto.currency ?? board.currency,
      },
    });
  }

  async deleteBoard(userId: string, id: string): Promise<{ id: string }> {
    await this.assertBoardOwner(userId, id);
    await this.prisma.financeBoard.delete({ where: { id } });
    return { id };
  }

  // ─── Categories ──────────────────────────────────────────

  async createCategory(
    userId: string,
    boardId: string,
    dto: CreateCategoryDto,
  ): Promise<FinanceCategory> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.financeCategory.create({
      data: {
        boardId,
        name: dto.name,
        categoryType: dto.categoryType,
        color: dto.color ?? '#94a3b8',
        icon: dto.icon ?? null,
      },
    });
  }

  async updateCategory(
    userId: string,
    boardId: string,
    catId: string,
    dto: UpdateCategoryDto,
  ): Promise<FinanceCategory> {
    const category = await this.findCategoryInBoard(userId, boardId, catId);
    return this.prisma.financeCategory.update({
      where: { id: catId },
      data: {
        name: dto.name ?? category.name,
        categoryType: dto.categoryType ?? category.categoryType,
        color: dto.color ?? category.color,
        icon: dto.icon ?? category.icon,
      },
    });
  }

  async deleteCategory(
    userId: string,
    boardId: string,
    catId: string,
  ): Promise<{ id: string }> {
    await this.findCategoryInBoard(userId, boardId, catId);
    await this.prisma.financeCategory.delete({ where: { id: catId } });
    return { id: catId };
  }

  // ─── Transactions ────────────────────────────────────────

  async listTransactions(
    userId: string,
    boardId: string,
    params: ListTransactionsParams,
  ): Promise<Transaction[]> {
    await this.assertBoardOwner(userId, boardId);

    const where: Prisma.TransactionWhereInput = { boardId };
    if (params.start || params.end) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (params.start) dateFilter.gte = new Date(params.start);
      if (params.end) dateFilter.lte = new Date(params.end);
      where.date = dateFilter;
    }
    if (params.type === 'INCOME' || params.type === 'EXPENSE') {
      where.type = params.type;
    }
    if (params.category) {
      where.categoryId = params.category;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { category: true },
    });
  }

  async createTransaction(
    userId: string,
    boardId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    await this.assertBoardOwner(userId, boardId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }

    return this.prisma.transaction.create({
      data: {
        boardId,
        categoryId: dto.categoryId ?? null,
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        date: new Date(dto.date),
        notes: dto.notes ?? null,
        tags: dto.tags ?? [],
      },
    });
  }

  async updateTransaction(
    userId: string,
    boardId: string,
    txId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const tx = await this.findTransactionInBoard(userId, boardId, txId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }

    return this.prisma.transaction.update({
      where: { id: txId },
      data: {
        title: dto.title ?? tx.title,
        amount: dto.amount ?? tx.amount,
        type: dto.type ?? tx.type,
        date: dto.date ? new Date(dto.date) : tx.date,
        categoryId: dto.categoryId ?? tx.categoryId,
        notes: dto.notes ?? tx.notes,
        tags: dto.tags ?? tx.tags,
      },
    });
  }

  async deleteTransaction(
    userId: string,
    boardId: string,
    txId: string,
  ): Promise<{ id: string }> {
    await this.findTransactionInBoard(userId, boardId, txId);
    await this.prisma.transaction.delete({ where: { id: txId } });
    return { id: txId };
  }

  // ─── Budgets ─────────────────────────────────────────────

  async createBudget(
    userId: string,
    boardId: string,
    dto: CreateBudgetDto,
  ): Promise<Budget> {
    await this.assertBoardOwner(userId, boardId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }
    return this.prisma.budget.create({
      data: {
        boardId,
        categoryId: dto.categoryId ?? null,
        name: dto.name,
        amount: dto.amount,
        period: dto.period ?? 'MONTHLY',
      },
    });
  }

  async updateBudget(
    userId: string,
    boardId: string,
    budId: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findBudgetInBoard(userId, boardId, budId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }
    return this.prisma.budget.update({
      where: { id: budId },
      data: {
        name: dto.name ?? budget.name,
        amount: dto.amount ?? budget.amount,
        period: dto.period ?? budget.period,
        categoryId: dto.categoryId ?? budget.categoryId,
      },
    });
  }

  async deleteBudget(
    userId: string,
    boardId: string,
    budId: string,
  ): Promise<{ id: string }> {
    await this.findBudgetInBoard(userId, boardId, budId);
    await this.prisma.budget.delete({ where: { id: budId } });
    return { id: budId };
  }

  // ─── Summary ─────────────────────────────────────────────

  async summary(
    userId: string,
    boardId: string,
    params: ListTransactionsParams,
  ): Promise<FinanceSummary> {
    await this.assertBoardOwner(userId, boardId);

    const where: Prisma.TransactionWhereInput = { boardId };
    if (params.start || params.end) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (params.start) dateFilter.gte = new Date(params.start);
      if (params.end) dateFilter.lte = new Date(params.end);
      where.date = dateFilter;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    const totals = transactions.reduce(
      (acc, t) => {
        if (t.type === ('INCOME' satisfies FinanceCategoryType)) acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const byCategoryMap = new Map<string, CategorySummary>();
    for (const t of transactions) {
      if (t.type !== ('EXPENSE' satisfies FinanceCategoryType)) continue;
      const key = t.categoryId ?? 'uncategorized';
      const current = byCategoryMap.get(key);
      if (current) {
        current.total += t.amount;
      } else {
        byCategoryMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.category?.name ?? 'Sin categoría',
          categoryColor: t.category?.color ?? '#94a3b8',
          total: t.amount,
        });
      }
    }

    return {
      income: round2(totals.income),
      expense: round2(totals.expense),
      balance: round2(totals.income - totals.expense),
      byCategory: Array.from(byCategoryMap.values())
        .map((c) => ({ ...c, total: round2(c.total) }))
        .sort((a, b) => b.total - a.total),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async assertBoardOwner(userId: string, boardId: string): Promise<FinanceBoard> {
    const board = await this.prisma.financeBoard.findFirst({
      where: { id: boardId, userId },
    });
    if (!board) {
      throw new NotFoundException('Finance board not found');
    }
    return board;
  }

  private async findCategoryInBoard(
    userId: string,
    boardId: string,
    catId: string,
  ): Promise<FinanceCategory> {
    const category = await this.prisma.financeCategory.findFirst({
      where: { id: catId, boardId, board: { userId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async findTransactionInBoard(
    userId: string,
    boardId: string,
    txId: string,
  ): Promise<Transaction> {
    const tx = await this.prisma.transaction.findFirst({
      where: { id: txId, boardId, board: { userId } },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return tx;
  }

  private async findBudgetInBoard(
    userId: string,
    boardId: string,
    budId: string,
  ): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budId, boardId, board: { userId } },
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
