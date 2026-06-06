import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';
import type { TokenPair, User } from '../models/user.model';

interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
  acceptedTerms: boolean;
  acceptedNoDataSelling: boolean;
  captchaToken?: string;
}

export type LoginResult = { user: User } | { requires2FA: true; tempToken: string };

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly ACCESS_KEY = 'omnidesk:access_token';
  private static readonly REFRESH_KEY = 'omnidesk:refresh_token';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  get accessToken(): string | null {
    return localStorage.getItem(AuthService.ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(AuthService.REFRESH_KEY);
  }

  private setTokens(pair: TokenPair): void {
    localStorage.setItem(AuthService.ACCESS_KEY, pair.accessToken);
    localStorage.setItem(AuthService.REFRESH_KEY, pair.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(AuthService.ACCESS_KEY);
    localStorage.removeItem(AuthService.REFRESH_KEY);
  }

  register(dto: RegisterDto): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/register`, dto)
      .pipe(map((r) => r.data));
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/verify-email`, { token })
      .pipe(map((r) => r.data));
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<TokenPair | { requires2FA: true; tempToken: string }>>(
        `${environment.apiUrl}/auth/login`,
        { email, password },
      )
      .pipe(
        switchMap((r) => {
          const data = r.data;
          if ('requires2FA' in data) {
            return of<LoginResult>({ requires2FA: true, tempToken: data.tempToken });
          }
          this.setTokens(data);
          return this.fetchMe().pipe(map((user) => ({ user }) as LoginResult));
        }),
      );
  }

  /** Completes a login that required a second factor. */
  verifyTwoFactor(tempToken: string, code: string): Observable<User> {
    return this.http
      .post<ApiResponse<TokenPair>>(`${environment.apiUrl}/auth/2fa/verify`, { tempToken, code })
      .pipe(
        map((r) => r.data),
        tap((tokens) => this.setTokens(tokens)),
        switchMap(() => this.fetchMe()),
      );
  }

  twoFactorStatus(): Observable<{ enabled: boolean }> {
    return this.http
      .get<ApiResponse<{ enabled: boolean }>>(`${environment.apiUrl}/auth/2fa/status`)
      .pipe(map((r) => r.data));
  }

  twoFactorSetup(): Observable<TwoFactorSetup> {
    return this.http
      .post<ApiResponse<TwoFactorSetup>>(`${environment.apiUrl}/auth/2fa/setup`, {})
      .pipe(map((r) => r.data));
  }

  twoFactorEnable(code: string): Observable<{ backupCodes: string[] }> {
    return this.http
      .post<ApiResponse<{ backupCodes: string[] }>>(`${environment.apiUrl}/auth/2fa/enable`, { code })
      .pipe(map((r) => r.data));
  }

  twoFactorDisable(code: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/2fa/disable`, { code })
      .pipe(map((r) => r.data));
  }

  twoFactorRegenerate(code: string): Observable<{ backupCodes: string[] }> {
    return this.http
      .post<ApiResponse<{ backupCodes: string[] }>>(
        `${environment.apiUrl}/auth/2fa/regenerate-backup-codes`,
        { code },
      )
      .pipe(map((r) => r.data));
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http
      .request<ApiResponse<{ message: string }>>(
        'DELETE',
        `${environment.apiUrl}/auth/account`,
        { body: { password } },
      )
      .pipe(map((r) => r.data));
  }

  restoreAccount(token: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/restore-account`, { token })
      .pipe(map((r) => r.data));
  }

  forgotPassword(email: string, captchaToken?: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/forgot-password`, {
        email,
        captchaToken,
      })
      .pipe(map((r) => r.data));
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/reset-password`, {
        token,
        newPassword,
      })
      .pipe(map((r) => r.data));
  }

  fetchMe(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      map((r) => r.data),
      tap((user) => this._user.set(user)),
    );
  }

  refresh(): Observable<string> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return of('').pipe(
        tap(() => {
          throw new Error('No refresh token');
        }),
      );
    }
    return this.http
      .post<ApiResponse<{ accessToken: string }>>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        map((r) => r.data.accessToken),
        tap((accessToken) => localStorage.setItem(AuthService.ACCESS_KEY, accessToken)),
      );
  }

  logout(): void {
    this.clearTokens();
    this._user.set(null);
    void this.router.navigate(['/auth/login']);
  }

  bootstrap(): Observable<User | null> {
    if (!this.accessToken) return of(null);
    return this.fetchMe().pipe(
      catchError(() => {
        this.clearTokens();
        return of(null);
      }),
    );
  }
}
