import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CalendarEvent,
  CalendarEventNotification,
  CreateEventDto,
  UpdateEventDto,
} from '../calendar.types';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/calendar`;

  list(start?: string, end?: string): Observable<CalendarEvent[]> {
    let params: Record<string, string> = {};
    if (start) params['start'] = start;
    if (end) params['end'] = end;
    return this.http
      .get<ApiResponse<CalendarEvent[]>>(`${this.base}/events`, { params })
      .pipe(map((r) => r.data));
  }

  findById(id: string): Observable<CalendarEvent> {
    return this.http
      .get<ApiResponse<CalendarEvent>>(`${this.base}/events/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: CreateEventDto): Observable<CalendarEvent> {
    return this.http
      .post<ApiResponse<CalendarEvent>>(`${this.base}/events`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateEventDto): Observable<CalendarEvent> {
    return this.http
      .patch<ApiResponse<CalendarEvent>>(`${this.base}/events/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/events/${id}`)
      .pipe(map((r) => r.data));
  }

  attachNotification(
    eventId: string,
    notificationId: string,
    minutesBefore: number,
  ): Observable<CalendarEventNotification> {
    return this.http
      .post<ApiResponse<CalendarEventNotification>>(
        `${this.base}/events/${eventId}/notifications`,
        { notificationId, minutesBefore },
      )
      .pipe(map((r) => r.data));
  }

  detachNotification(eventId: string, notifId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(
        `${this.base}/events/${eventId}/notifications/${notifId}`,
      )
      .pipe(map((r) => r.data));
  }
}
