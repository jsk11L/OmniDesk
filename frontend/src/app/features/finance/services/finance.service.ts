import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  Budget,
  CreateBoardDto,
  CreateBudgetDto,
  CreateCategoryDto,
  CreateRecurringDto,
  CreateTransactionDto,
  FinanceBoard,
  FinanceCategory,
  FinanceSummary,
  RecurringTransaction,
  Transaction,
  UpdateBudgetDto,
  UpdateRecurringDto,
  UpdateTransactionDto,
} from '../finance.types';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/finance`;

  listBoards(): Observable<FinanceBoard[]> {
    return this.http
      .get<ApiResponse<FinanceBoard[]>>(`${this.base}/boards`)
      .pipe(map((r) => r.data));
  }

  findBoard(id: string): Observable<FinanceBoard> {
    return this.http
      .get<ApiResponse<FinanceBoard>>(`${this.base}/boards/${id}`)
      .pipe(map((r) => r.data));
  }

  createBoard(dto: CreateBoardDto): Observable<FinanceBoard> {
    return this.http
      .post<ApiResponse<FinanceBoard>>(`${this.base}/boards`, dto)
      .pipe(map((r) => r.data));
  }

  listTransactions(
    boardId: string,
    opts: { start?: string; end?: string; type?: string; category?: string } = {},
  ): Observable<Transaction[]> {
    let params = new HttpParams();
    if (opts.start) params = params.set('start', opts.start);
    if (opts.end) params = params.set('end', opts.end);
    if (opts.type) params = params.set('type', opts.type);
    if (opts.category) params = params.set('category', opts.category);
    return this.http
      .get<ApiResponse<Transaction[]>>(`${this.base}/boards/${boardId}/transactions`, { params })
      .pipe(map((r) => r.data));
  }

  createTransaction(boardId: string, dto: CreateTransactionDto): Observable<Transaction> {
    return this.http
      .post<ApiResponse<Transaction>>(`${this.base}/boards/${boardId}/transactions`, dto)
      .pipe(map((r) => r.data));
  }

  updateTransaction(
    boardId: string,
    txId: string,
    dto: UpdateTransactionDto,
  ): Observable<Transaction> {
    return this.http
      .patch<ApiResponse<Transaction>>(
        `${this.base}/boards/${boardId}/transactions/${txId}`,
        dto,
      )
      .pipe(map((r) => r.data));
  }

  deleteTransaction(boardId: string, txId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(
        `${this.base}/boards/${boardId}/transactions/${txId}`,
      )
      .pipe(map((r) => r.data));
  }

  summary(
    boardId: string,
    opts: { start?: string; end?: string } = {},
  ): Observable<FinanceSummary> {
    let params = new HttpParams();
    if (opts.start) params = params.set('start', opts.start);
    if (opts.end) params = params.set('end', opts.end);
    return this.http
      .get<ApiResponse<FinanceSummary>>(`${this.base}/boards/${boardId}/summary`, { params })
      .pipe(map((r) => r.data));
  }

  // ─── Recurring transactions ──────────────────────────────

  listRecurring(boardId: string): Observable<RecurringTransaction[]> {
    return this.http
      .get<ApiResponse<RecurringTransaction[]>>(`${this.base}/boards/${boardId}/recurring`)
      .pipe(map((r) => r.data));
  }

  createRecurring(boardId: string, dto: CreateRecurringDto): Observable<RecurringTransaction> {
    return this.http
      .post<ApiResponse<RecurringTransaction>>(`${this.base}/boards/${boardId}/recurring`, dto)
      .pipe(map((r) => r.data));
  }

  updateRecurring(
    boardId: string,
    recId: string,
    dto: UpdateRecurringDto,
  ): Observable<RecurringTransaction> {
    return this.http
      .patch<ApiResponse<RecurringTransaction>>(
        `${this.base}/boards/${boardId}/recurring/${recId}`,
        dto,
      )
      .pipe(map((r) => r.data));
  }

  deleteRecurring(boardId: string, recId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/boards/${boardId}/recurring/${recId}`)
      .pipe(map((r) => r.data));
  }

  createCategory(boardId: string, dto: CreateCategoryDto): Observable<FinanceCategory> {
    return this.http
      .post<ApiResponse<FinanceCategory>>(`${this.base}/boards/${boardId}/categories`, dto)
      .pipe(map((r) => r.data));
  }

  deleteCategory(boardId: string, catId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(
        `${this.base}/boards/${boardId}/categories/${catId}`,
      )
      .pipe(map((r) => r.data));
  }

  createBudget(boardId: string, dto: CreateBudgetDto): Observable<Budget> {
    return this.http
      .post<ApiResponse<Budget>>(`${this.base}/boards/${boardId}/budgets`, dto)
      .pipe(map((r) => r.data));
  }

  updateBudget(boardId: string, budId: string, dto: UpdateBudgetDto): Observable<Budget> {
    return this.http
      .patch<ApiResponse<Budget>>(`${this.base}/boards/${boardId}/budgets/${budId}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteBudget(boardId: string, budId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/boards/${boardId}/budgets/${budId}`)
      .pipe(map((r) => r.data));
  }
}
