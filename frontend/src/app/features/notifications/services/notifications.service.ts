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

export type AttachEntityType =
  | 'calendar-event'
  | 'note'
  | 'list-item'
  | 'todo-item'
  | 'habit'
  | 'wishlist-item'
  | 'planned-purchase'
  | 'savings-goal';

export interface AttachedNotification {
  id: string;
  notificationId: string;
  minutesBefore?: number | null;
  timeOfDay?: string | null;
  daysBefore?: number | null;
  notification: NotificationConfig;
}

export interface AttachOptions {
  notificationId: string;
  minutesBefore?: number;
  timeOfDay?: string;
  daysBefore?: number;
}

export interface NotificationPreferences {
  timezone: string | null;
  dndStart: string | null;
  dndEnd: string | null;
  quietDays: number[];
}

export interface PushDevice {
  id: string;
  deviceLabel: string | null;
  platform: string | null;
  userAgent: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  listTargets(type: AttachEntityType, entityId: string): Observable<AttachedNotification[]> {
    return this.http
      .get<ApiResponse<AttachedNotification[]>>(`${this.base}/targets/${type}/${entityId}`)
      .pipe(map((r) => r.data));
  }

  attachTarget(
    type: AttachEntityType,
    entityId: string,
    options: AttachOptions,
  ): Observable<AttachedNotification> {
    return this.http
      .post<ApiResponse<AttachedNotification>>(`${this.base}/targets/${type}/${entityId}`, options)
      .pipe(map((r) => r.data));
  }

  detachTarget(
    type: AttachEntityType,
    entityId: string,
    notificationId: string,
  ): Observable<{ detached: boolean }> {
    return this.http
      .delete<ApiResponse<{ detached: boolean }>>(
        `${this.base}/targets/${type}/${entityId}/${notificationId}`,
      )
      .pipe(map((r) => r.data));
  }

  listDevices(): Observable<PushDevice[]> {
    return this.http
      .get<ApiResponse<PushDevice[]>>(`${this.base}/push/devices`)
      .pipe(map((r) => r.data));
  }

  removeDevice(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/push/devices/${id}`)
      .pipe(map((r) => r.data));
  }

  getPreferences(): Observable<NotificationPreferences> {
    return this.http
      .get<ApiResponse<NotificationPreferences>>(`${this.base}/preferences`)
      .pipe(map((r) => r.data));
  }

  updatePreferences(dto: Partial<NotificationPreferences>): Observable<NotificationPreferences> {
    return this.http
      .patch<ApiResponse<NotificationPreferences>>(`${this.base}/preferences`, dto)
      .pipe(map((r) => r.data));
  }

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
