export type FinanceCategoryType = 'INCOME' | 'EXPENSE';
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'ANNUAL';

export interface FinanceCategory {
  id: string;
  boardId: string;
  name: string;
  color: string;
  icon: string | null;
  categoryType: FinanceCategoryType;
}

export interface Transaction {
  id: string;
  boardId: string;
  categoryId: string | null;
  title: string;
  amount: number;
  type: FinanceCategoryType;
  date: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category?: FinanceCategory | null;
}

export interface Budget {
  id: string;
  boardId: string;
  categoryId: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  createdAt: string;
}

export interface FinanceBoard {
  id: string;
  userId: string;
  name: string;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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

// ─── Organizer ─────────────────────────────────────────

export type WishlistPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WishlistItem {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  estimatedPrice: number | null;
  currency: string;
  url: string | null;
  category: string | null;
  priority: WishlistPriority;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedPurchase {
  id: string;
  boardId: string;
  title: string;
  amount: number;
  currency: string;
  targetDate: string;
  categoryId: string | null;
  isPurchased: boolean;
  purchasedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  notes: string | null;
}

export interface SavingsGoal {
  id: string;
  boardId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  icon: string | null;
  color: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
