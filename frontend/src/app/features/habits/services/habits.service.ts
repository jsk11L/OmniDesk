import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  CreateHabitDto,
  Habit,
  HabitEntry,
  HabitEntryStatus,
  HabitStats,
  HabitWeek,
  MarkHabitEntryDto,
  UpdateHabitDto,
} from '../habits.types';

@Injectable({ providedIn: 'root' })
export class HabitsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/habits`;

  list(): Observable<Habit[]> {
    return this.http.get<ApiResponse<Habit[]>>(this.base).pipe(map((r) => r.data));
  }

  /** Today's entry status per habit in one request (avoids the per-habit N+1). */
  today(): Observable<{ habitId: string; status: HabitEntryStatus }[]> {
    return this.http
      .get<ApiResponse<{ habitId: string; status: HabitEntryStatus }[]>>(`${this.base}/today`)
      .pipe(map((r) => r.data));
  }

  /** Current-week status per habit in one request, for the week-row UI. */
  week(): Observable<HabitWeek[]> {
    return this.http.get<ApiResponse<HabitWeek[]>>(`${this.base}/week`).pipe(map((r) => r.data));
  }

  findById(id: string): Observable<Habit> {
    return this.http.get<ApiResponse<Habit>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(dto: CreateHabitDto): Observable<Habit> {
    return this.http.post<ApiResponse<Habit>>(this.base, dto).pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateHabitDto): Observable<Habit> {
    return this.http
      .patch<ApiResponse<Habit>>(`${this.base}/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  entries(id: string, from?: string, to?: string): Observable<HabitEntry[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http
      .get<ApiResponse<HabitEntry[]>>(`${this.base}/${id}/entries`, { params })
      .pipe(map((r) => r.data));
  }

  markEntry(id: string, dto: MarkHabitEntryDto): Observable<HabitEntry> {
    return this.http
      .post<ApiResponse<HabitEntry>>(`${this.base}/${id}/entries`, dto)
      .pipe(map((r) => r.data));
  }

  deleteEntry(id: string, date: string): Observable<{ date: string }> {
    return this.http
      .delete<ApiResponse<{ date: string }>>(`${this.base}/${id}/entries/${date}`)
      .pipe(map((r) => r.data));
  }

  stats(id: string): Observable<HabitStats> {
    return this.http.get<ApiResponse<HabitStats>>(`${this.base}/${id}/stats`).pipe(map((r) => r.data));
  }
}
