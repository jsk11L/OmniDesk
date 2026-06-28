import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../core/models/api-response.model';

export type FavoriteKind = 'LIST' | 'NOTE';

export interface Favorite {
  id: string;
  kind: FavoriteKind;
  entityId: string;
  label: string;
  icon: string | null;
}

/**
 * Shared, signal-backed store for sidebar favorites. The sidebar reads the
 * signal reactively; list/note views toggle entries and the sidebar updates
 * without a round-trip.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/favorites`;

  readonly favorites = signal<Favorite[]>([]);

  load(): void {
    this.http
      .get<ApiResponse<Favorite[]>>(this.base)
      .subscribe({
        next: (r) => this.favorites.set(r.data),
        error: () => undefined,
      });
  }

  isFavorite(kind: FavoriteKind, entityId: string): boolean {
    return this.favorites().some((f) => f.kind === kind && f.entityId === entityId);
  }

  toggle(kind: FavoriteKind, entityId: string): void {
    if (this.isFavorite(kind, entityId)) {
      this.http
        .delete<ApiResponse<{ removed: boolean }>>(`${this.base}/${kind}/${entityId}`)
        .subscribe({
          next: () =>
            this.favorites.update((arr) =>
              arr.filter((f) => !(f.kind === kind && f.entityId === entityId)),
            ),
          error: () => undefined,
        });
    } else {
      this.http
        .post<ApiResponse<Favorite>>(this.base, { kind, entityId })
        .subscribe({
          next: (r) => this.favorites.update((arr) => [...arr, r.data]),
          error: () => undefined,
        });
    }
  }
}
