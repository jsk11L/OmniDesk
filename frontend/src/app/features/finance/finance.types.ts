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
