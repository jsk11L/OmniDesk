import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';
import type { Theme } from '../models/theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);

  private readonly _themes = signal<Theme[]>([]);
  readonly themes = this._themes.asReadonly();

  private readonly _activeTheme = signal<Theme | null>(null);
  readonly activeTheme = this._activeTheme.asReadonly();

  loadThemes(): Observable<Theme[]> {
    return this.http.get<ApiResponse<Theme[]>>(`${environment.apiUrl}/themes`).pipe(
      map((r) => r.data),
      tap((themes) => this._themes.set(themes)),
    );
  }

  activate(themeId: string): Observable<Theme> {
    return this.http
      .patch<ApiResponse<{ activeThemeId: string }>>(
        `${environment.apiUrl}/themes/${themeId}/activate`,
        {},
      )
      .pipe(
        map((r) => r.data),
        tap(() => {
          const target = this._themes().find((t) => t.id === themeId);
          if (target) this.applyTheme(target);
        }),
        map(() => this._activeTheme()!),
      );
  }

  applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colorPrimary);
    root.style.setProperty('--color-secondary', theme.colorSecondary);
    root.style.setProperty('--color-background', theme.colorBackground);
    root.style.setProperty('--color-surface', theme.colorSurface);
    root.style.setProperty('--color-surface-hover', theme.colorSurfaceHover);
    root.style.setProperty('--color-border', theme.colorBorder);
    root.style.setProperty('--color-text', theme.colorText);
    root.style.setProperty('--color-text-muted', theme.colorTextMuted);
    root.style.setProperty('--color-accent', theme.colorAccent);
    root.style.setProperty('--color-danger', theme.colorDanger);
    root.style.setProperty('--color-success', theme.colorSuccess);
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--border-radius', theme.borderRadius);
    root.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
    this._activeTheme.set(theme);
  }

  bootstrap(activeThemeId: string | null): void {
    this.loadThemes().subscribe({
      next: (themes) => {
        const active =
          (activeThemeId ? themes.find((t) => t.id === activeThemeId) : null) ??
          themes.find((t) => t.isDefault) ??
          themes[0];
        if (active) this.applyTheme(active);
      },
      error: (err) => console.warn('Failed to load themes:', err),
    });
  }
}
