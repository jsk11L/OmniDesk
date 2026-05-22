import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';
import type { DashboardData } from './dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/dashboard`;

  load(): Observable<DashboardData> {
    return this.http.get<ApiResponse<DashboardData>>(this.endpoint).pipe(map((r) => r.data));
  }
}
