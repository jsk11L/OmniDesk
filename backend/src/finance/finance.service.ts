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
  RecurringFrequency,
  RecurringTransaction,
  Transaction,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  Paginated,
  PaginationQuery,
  buildPageMeta,
  resolvePagination,
} from '../common/pagination';
import { CreateFinanceBoardDto } from './dto/create-finance-board.dto';
import { UpdateFinanceBoardDto } from './dto/update-finance-board.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

export interface ListTransactionsParams extends PaginationQuery {
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
  ): Promise<Paginated<Transaction>> {
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

    const pagination = resolvePagination(params);
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        include: { category: true },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, meta: buildPageMeta(pagination, total) };
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

  // ─── Recurring transactions ──────────────────────────────

  async listRecurring(
    userId: string,
    boardId: string,
  ): Promise<RecurringTransaction[]> {
    await this.assertBoardOwner(userId, boardId);
    return this.prisma.recurringTransaction.findMany({
      where: { boardId },
      orderBy: [{ isActive: 'desc' }, { nextRun: 'asc' }],
      include: { category: true },
    });
  }

  async createRecurring(
    userId: string,
    boardId: string,
    dto: CreateRecurringTransactionDto,
  ): Promise<RecurringTransaction> {
    await this.assertBoardOwner(userId, boardId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }
    return this.prisma.recurringTransaction.create({
      data: {
        boardId,
        categoryId: dto.categoryId ?? null,
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        notes: dto.notes ?? null,
        tags: dto.tags ?? [],
        nextRun: new Date(dto.nextRun),
      },
    });
  }

  async updateRecurring(
    userId: string,
    boardId: string,
    recId: string,
    dto: UpdateRecurringTransactionDto,
  ): Promise<RecurringTransaction> {
    const rec = await this.findRecurringInBoard(userId, boardId, recId);
    if (dto.categoryId) {
      await this.findCategoryInBoard(userId, boardId, dto.categoryId);
    }
    return this.prisma.recurringTransaction.update({
      where: { id: recId },
      data: {
        title: dto.title ?? rec.title,
        amount: dto.amount ?? rec.amount,
        type: dto.type ?? rec.type,
        frequency: dto.frequency ?? rec.frequency,
        nextRun: dto.nextRun ? new Date(dto.nextRun) : rec.nextRun,
        isActive: dto.isActive ?? rec.isActive,
        categoryId: dto.categoryId ?? rec.categoryId,
        notes: dto.notes ?? rec.notes,
        tags: dto.tags ?? rec.tags,
      },
    });
  }

  async deleteRecurring(
    userId: string,
    boardId: string,
    recId: string,
  ): Promise<{ id: string }> {
    await this.findRecurringInBoard(userId, boardId, recId);
    await this.prisma.recurringTransaction.delete({ where: { id: recId } });
    return { id: recId };
  }

  /**
   * Materializes every active recurring template whose `nextRun` has passed,
   * creating a real Transaction and advancing `nextRun` by `frequency`. A single
   * template can fire several times if it was due more than once (e.g. the
   * scheduler was offline) — the loop is bounded to avoid runaway catch-up.
   * Returns the number of transactions created. Used by the scheduler.
   */
  async materializeDueRecurring(now: Date = new Date()): Promise<number> {
    const due = await this.prisma.recurringTransaction.findMany({
      where: { isActive: true, nextRun: { lte: now } },
    });

    let created = 0;
    for (const rec of due) {
      let cursor = rec.nextRun;
      const operations: Prisma.PrismaPromise<unknown>[] = [];
      // Cap catch-up at 60 occurrences to stay bounded if a template was paused
      // for a long time or has a daily cadence with a stale nextRun.
      for (let i = 0; i < 60 && cursor <= now; i++) {
        operations.push(
          this.prisma.transaction.create({
            data: {
              boardId: rec.boardId,
              categoryId: rec.categoryId,
              title: rec.title,
              amount: rec.amount,
              type: rec.type,
              date: cursor,
              notes: rec.notes,
              tags: rec.tags,
            },
          }),
        );
        cursor = advanceDate(cursor, rec.frequency);
      }
      operations.push(
        this.prisma.recurringTransaction.update({
          where: { id: rec.id },
          data: { nextRun: cursor, lastRun: now },
        }),
      );
      await this.prisma.$transaction(operations);
      created += operations.length - 1;
    }
    return created;
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
          categoryName: t.category?.name ?? 'Uncategorized',
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

  private async findRecurringInBoard(
    userId: string,
    boardId: string,
    recId: string,
  ): Promise<RecurringTransaction> {
    const rec = await this.prisma.recurringTransaction.findFirst({
      where: { id: recId, boardId, board: { userId } },
    });
    if (!rec) {
      throw new NotFoundException('Recurring transaction not found');
    }
    return rec;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Returns a new Date advanced by one cadence step. Month/year math uses
 * setMonth/setFullYear, which JS clamps correctly (e.g. Jan 31 + 1 month → Feb 28/29). */
function advanceDate(from: Date, frequency: RecurringFrequency): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
