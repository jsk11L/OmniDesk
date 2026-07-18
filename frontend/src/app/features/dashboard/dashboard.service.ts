import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';
import type { DashboardConfig, DashboardData, DashboardWidgetPref } from './dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/dashboard`;

  load(): Observable<DashboardData> {
    return this.http.get<ApiResponse<DashboardData>>(this.endpoint).pipe(map((r) => r.data));
  }

  /** The user's saved widget layout, or null if never customized. */
  loadConfig(): Observable<DashboardConfig | null> {
    return this.http
      .get<ApiResponse<DashboardConfig | null>>(`${this.endpoint}/config`)
      .pipe(map((r) => r.data));
  }

  saveConfig(widgets: DashboardWidgetPref[]): Observable<DashboardConfig> {
    return this.http
      .put<ApiResponse<DashboardConfig>>(`${this.endpoint}/config`, { widgets })
      .pipe(map((r) => r.data));
  }
}
