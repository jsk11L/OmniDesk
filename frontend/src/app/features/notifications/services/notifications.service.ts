import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CreateNotificationDto,
  InAppNotification,
  NotificationConfig,
  UpdateNotificationDto,
} from '../notifications.types';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  list(): Observable<NotificationConfig[]> {
    return this.http.get<ApiResponse<NotificationConfig[]>>(this.base).pipe(map((r) => r.data));
  }

  findById(id: string): Observable<NotificationConfig> {
    return this.http
      .get<ApiResponse<NotificationConfig>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: CreateNotificationDto): Observable<NotificationConfig> {
    return this.http.post<ApiResponse<NotificationConfig>>(this.base, dto).pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateNotificationDto): Observable<NotificationConfig> {
    return this.http
      .patch<ApiResponse<NotificationConfig>>(`${this.base}/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  fire(id: string): Observable<{ inAppCreated: boolean; pushSent: number; emailsSent: number }> {
    return this.http
      .post<ApiResponse<{ inAppCreated: boolean; pushSent: number; emailsSent: number }>>(
        `${this.base}/${id}/fire`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  listInbox(): Observable<InAppNotification[]> {
    return this.http
      .get<ApiResponse<InAppNotification[]>>(`${this.base}/inbox`)
      .pipe(map((r) => r.data));
  }

  markAsRead(id: string): Observable<InAppNotification> {
    return this.http
      .patch<ApiResponse<InAppNotification>>(`${this.base}/inbox/${id}/read`, {})
      .pipe(map((r) => r.data));
  }

  clearInbox(): Observable<{ deleted: number }> {
    return this.http
      .delete<ApiResponse<{ deleted: number }>>(`${this.base}/inbox/clear`)
      .pipe(map((r) => r.data));
  }
}
