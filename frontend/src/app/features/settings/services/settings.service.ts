import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Theme } from '../../../core/models/theme.model';
import type { User } from '../../../core/models/user.model';

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}

export interface CreateThemeDto {
  name: string;
  isDark?: boolean;
  colorPrimary?: string;
  colorSecondary?: string;
  colorBackground?: string;
  colorSurface?: string;
  colorSurfaceHover?: string;
  colorBorder?: string;
  colorText?: string;
  colorTextMuted?: string;
  colorAccent?: string;
  colorDanger?: string;
  colorSuccess?: string;
  fontFamily?: string;
  borderRadius?: string;
}

export type UpdateThemeDto = Partial<CreateThemeDto>;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  updateProfile(dto: UpdateProfileDto): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, dto)
      .pipe(map((r) => r.data));
  }

  createTheme(dto: CreateThemeDto): Observable<Theme> {
    return this.http
      .post<ApiResponse<Theme>>(`${environment.apiUrl}/themes`, dto)
      .pipe(map((r) => r.data));
  }

  updateTheme(id: string, dto: UpdateThemeDto): Observable<Theme> {
    return this.http
      .patch<ApiResponse<Theme>>(`${environment.apiUrl}/themes/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteTheme(id: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${environment.apiUrl}/themes/${id}`)
      .pipe(map((r) => r.data));
  }
}
