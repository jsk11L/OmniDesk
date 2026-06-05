// Entity shapes from the Prisma-generated source (D-011). API responses nest
// some relations (transaction.category, board.categories/budgets,
// goal.contributions), composed here. Enums used by the DTOs below are imported
// (local binding) and re-exported.
import type {
  Transaction as TransactionBase,
  FinanceBoard as FinanceBoardBase,
  SavingsGoal as SavingsGoalBase,
  FinanceCategory,
  Budget,
  SavingsContribution,
  WishlistItem,
  PlannedPurchase,
  FinanceCategoryType,
  BudgetPeriod,
  WishlistPriority,
} from '@omnidesk/shared';

export type {
  FinanceCategory,
  Budget,
  SavingsContribution,
  WishlistItem,
  PlannedPurchase,
  FinanceCategoryType,
  BudgetPeriod,
  WishlistPriority,
};

export interface Transaction extends TransactionBase {
  category?: FinanceCategory | null;
}

export interface FinanceBoard extends FinanceBoardBase {
  categories?: FinanceCategory[];
  budgets?: Budget[];
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    categoryId: string | null;
    categoryName: string;
    categoryColor: string;
    total: number;
  }[];
}

export interface CreateBoardDto {
  name: string;
  currency?: string;
}

export interface CreateCategoryDto {
  name: string;
  categoryType: FinanceCategoryType;
  color?: string;
  icon?: string;
}

export interface CreateTransactionDto {
  title: string;
  amount: number;
  type: FinanceCategoryType;
  date: string;
  categoryId?: string;
  notes?: string;
  tags?: string[];
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export interface CreateBudgetDto {
  name: string;
  amount: number;
  period?: BudgetPeriod;
  categoryId?: string;
}

export type UpdateBudgetDto = Partial<CreateBudgetDto>;

// ─── Organizer ─────────────────────────────────────────
// WishlistItem, PlannedPurchase and SavingsContribution come from the shared
// generated source (re-exported at the top of this file).

export interface SavingsGoal extends SavingsGoalBase {
  contributions?: SavingsContribution[];
}

export interface CreateWishlistDto {
  title: string;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  currency?: string;
  url?: string;
  category?: string;
  priority?: WishlistPriority;
}

export interface CreatePlannedPurchaseDto {
  title: string;
  amount: number;
  currency?: string;
  targetDate: string;
  categoryId?: string;
  notes?: string;
}

export interface CreateSavingsGoalDto {
  name: string;
  targetAmount: number;
  currency?: string;
  targetDate?: string;
  icon?: string;
  color?: string;
}

export interface CreateContributionDto {
  amount: number;
  notes?: string;
  date?: string;
}
