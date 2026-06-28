import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';

export interface AdminStats {
  total: number;
  admins: number;
  suspended: number;
  verified: number;
  pendingDeletion: number;
  twoFactor: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  deletedAt: string | null;
  totpEnabledAt: string | null;
  lastLoginAt: string | null;
  uploadBytesUsed: number;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  stats(): Observable<AdminStats> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.base}/stats`).pipe(map((r) => r.data));
  }

  users(page = 1, q = ''): Observable<Paginated<AdminUser>> {
    let params = new HttpParams().set('page', page);
    if (q) params = params.set('q', q);
    return this.http
      .get<ApiResponse<AdminUser[]> & { meta: PageMeta }>(`${this.base}/users`, { params })
      .pipe(map((r) => ({ items: r.data, ...r.meta })));
  }

  suspend(id: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.base}/users/${id}/suspend`, {})
      .pipe(map((r) => r.data));
  }

  unsuspend(id: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.base}/users/${id}/unsuspend`, {})
      .pipe(map((r) => r.data));
  }

  disableTwoFactor(id: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.base}/users/${id}/disable-2fa`, {})
      .pipe(map((r) => r.data));
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.base}/users/${id}`)
      .pipe(map((r) => r.data));
  }

  auditLog(page = 1): Observable<Paginated<AuditEntry>> {
    const params = new HttpParams().set('page', page);
    return this.http
      .get<ApiResponse<AuditEntry[]> & { meta: PageMeta }>(`${this.base}/audit-log`, { params })
      .pipe(map((r) => ({ items: r.data, ...r.meta })));
  }
}
