import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CreateContributionDto,
  CreatePlannedPurchaseDto,
  CreateSavingsGoalDto,
  CreateWishlistDto,
  PlannedPurchase,
  SavingsContribution,
  SavingsGoal,
  WishlistItem,
} from '../finance.types';

@Injectable({ providedIn: 'root' })
export class OrganizerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/finance`;

  // Wishlist
  listWishlist(boardId: string): Observable<WishlistItem[]> {
    return this.http
      .get<ApiResponse<WishlistItem[]>>(`${this.base}/boards/${boardId}/wishlist`)
      .pipe(map((r) => r.data));
  }

  createWishlist(boardId: string, dto: CreateWishlistDto): Observable<WishlistItem> {
    return this.http
      .post<ApiResponse<WishlistItem>>(`${this.base}/boards/${boardId}/wishlist`, dto)
      .pipe(map((r) => r.data));
  }

  updateWishlist(
    id: string,
    dto: Partial<CreateWishlistDto> & { isArchived?: boolean },
  ): Observable<WishlistItem> {
    return this.http
      .patch<ApiResponse<WishlistItem>>(`${this.base}/wishlist/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteWishlist(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/wishlist/${id}`)
      .pipe(map((r) => r.data));
  }

  // Planned purchases
  listPlanned(boardId: string): Observable<PlannedPurchase[]> {
    return this.http
      .get<ApiResponse<PlannedPurchase[]>>(`${this.base}/boards/${boardId}/planned-purchases`)
      .pipe(map((r) => r.data));
  }

  createPlanned(boardId: string, dto: CreatePlannedPurchaseDto): Observable<PlannedPurchase> {
    return this.http
      .post<ApiResponse<PlannedPurchase>>(`${this.base}/boards/${boardId}/planned-purchases`, dto)
      .pipe(map((r) => r.data));
  }

  updatePlanned(
    id: string,
    dto: Partial<CreatePlannedPurchaseDto> & { isPurchased?: boolean; createTransaction?: boolean },
  ): Observable<PlannedPurchase> {
    return this.http
      .patch<ApiResponse<PlannedPurchase>>(`${this.base}/planned-purchases/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deletePlanned(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/planned-purchases/${id}`)
      .pipe(map((r) => r.data));
  }

  // Savings goals
  listGoals(boardId: string): Observable<SavingsGoal[]> {
    return this.http
      .get<ApiResponse<SavingsGoal[]>>(`${this.base}/boards/${boardId}/savings-goals`)
      .pipe(map((r) => r.data));
  }

  createGoal(boardId: string, dto: CreateSavingsGoalDto): Observable<SavingsGoal> {
    return this.http
      .post<ApiResponse<SavingsGoal>>(`${this.base}/boards/${boardId}/savings-goals`, dto)
      .pipe(map((r) => r.data));
  }

  updateGoal(id: string, dto: Partial<CreateSavingsGoalDto>): Observable<SavingsGoal> {
    return this.http
      .patch<ApiResponse<SavingsGoal>>(`${this.base}/savings-goals/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteGoal(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/savings-goals/${id}`)
      .pipe(map((r) => r.data));
  }

  addContribution(goalId: string, dto: CreateContributionDto): Observable<SavingsContribution> {
    return this.http
      .post<ApiResponse<SavingsContribution>>(
        `${this.base}/savings-goals/${goalId}/contributions`,
        dto,
      )
      .pipe(map((r) => r.data));
  }

  deleteContribution(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/contributions/${id}`)
      .pipe(map((r) => r.data));
  }
}
