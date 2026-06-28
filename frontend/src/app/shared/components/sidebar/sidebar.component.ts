import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { UploadsService } from '../../services/uploads.service';
import { FavoritesStore } from '../../services/favorites.store';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <aside class="sb">
      <div class="sb-header">
        <div class="sb-logo">O</div>
        <div class="sb-title">OmniDesk</div>
      </div>

      <button type="button" class="sb-search" (click)="openPalette()" title="Search (Ctrl/⌘ K)">
        <span class="sb-search-ico">🔍</span>
        <span class="sb-search-text">{{ 'sidebar.search' | translate }}</span>
        <span class="kbd">⌘K</span>
      </button>

      <nav class="sb-section">
        <div class="sb-section-label">{{ 'sidebar.workspace' | translate }}</div>
        @for (item of mainNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="nav-item"
          >
            <span class="nav-ico">{{ item.icon }}</span>
            <span>{{ item.label | translate }}</span>
          </a>
        }

        @if (favorites().length > 0) {
          <div class="sb-section-label" style="margin-top: 8px">{{ 'sidebar.favorites' | translate }}</div>
          @for (f of favorites(); track f.id) {
            <a [routerLink]="favRoute(f)" [queryParams]="favParams(f)" class="nav-item">
              <span class="nav-ico">{{ f.icon ?? (f.kind === 'LIST' ? '🗂️' : '📝') }}</span>
              <span class="truncate">{{ f.label }}</span>
            </a>
          }
        }
      </nav>

      <div class="sb-footer">
        <a routerLink="/app/notifications" routerLinkActive="active" class="nav-item">
          <span class="nav-ico">🔔</span>
          <span>{{ 'nav.notifications' | translate }}</span>
        </a>
        <a routerLink="/app/settings" routerLinkActive="active" class="nav-item">
          <span class="nav-ico">⚙️</span>
          <span>{{ 'nav.settings' | translate }}</span>
        </a>
        @if (isAdmin()) {
          <a routerLink="/app/admin" routerLinkActive="active" class="nav-item">
            <span class="nav-ico">🛡️</span>
            <span>{{ 'nav.admin' | translate }}</span>
          </a>
        }

        <label class="lang-row" [title]="'sidebar.language' | translate">
          <span class="nav-ico">🌐</span>
          <select class="lang-select" [value]="language.current()" (change)="onLangChange($event)">
            @for (l of language.available; track l.code) {
              <option [value]="l.code">{{ l.flag }} {{ l.label }}</option>
            }
          </select>
        </label>

        <div class="user-pill">
          <a routerLink="/app/settings" class="user-main" [title]="'sidebar.profile' | translate">
            @if (avatarSrc(); as src) {
              <img [src]="src" alt="" class="user-avatar-img" />
            } @else {
              <span class="user-avatar">{{ initials() }}</span>
            }
            <span class="user-meta">
              <span class="user-name">{{ displayName() }}</span>
              <span class="user-status">{{ userEmail() }}</span>
            </span>
          </a>
          <button type="button" (click)="logout()" class="user-logout" [title]="'sidebar.signOut' | translate">⎋</button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sb {
      width: 248px;
      flex-shrink: 0;
      height: 100%;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sb-header {
      padding: 14px 14px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--color-border-soft);
    }
    .sb-logo {
      width: 26px; height: 26px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary, #8b5cf6));
      display: grid; place-items: center;
      color: #fff; font-weight: 700; font-size: 13px;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 40%, transparent);
    }
    .sb-title { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }

    .sb-search {
      margin: 10px 12px 4px;
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px;
      background: var(--color-background);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: border-color 120ms;
      width: calc(100% - 24px);
      font-family: inherit;
    }
    .sb-search:hover { border-color: var(--color-border); }
    .sb-search-ico { font-size: 12px; opacity: 0.7; }
    .sb-search-text { color: var(--color-text-faint); font-size: 13px; flex: 1; text-align: left; }
    .kbd {
      font-family: var(--font-mono); font-size: 11px; padding: 2px 6px;
      border: 1px solid var(--color-border); border-radius: 4px;
      background: var(--color-surface); color: var(--color-text-muted);
    }

    .sb-section { padding: 8px; flex: 1; overflow-y: auto; }
    .sb-section-label {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-faint);
      padding: 8px 10px 4px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      font-size: 13px;
      cursor: pointer;
      transition: background 100ms, color 100ms;
      position: relative;
      text-decoration: none;
      user-select: none;
    }
    .nav-item:hover { background: var(--color-surface-hover); color: var(--color-text); }
    .nav-item.active { background: var(--color-surface-hover); color: var(--color-text); }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -2px; top: 7px; bottom: 7px; width: 2px;
      background: var(--color-primary);
      border-radius: 2px;
    }
    .nav-ico { width: 18px; font-size: 14px; flex-shrink: 0; text-align: center; }
    .nav-item .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .sb-footer {
      padding: 8px;
      border-top: 1px solid var(--color-border-soft);
    }

    .lang-row {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
    }
    .lang-row:hover { background: var(--color-surface-hover); }
    .lang-select {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      padding: 0;
    }
    .lang-select option { background: var(--color-surface); color: var(--color-text); }

    .user-pill {
      display: flex; align-items: center; gap: 6px;
      margin-top: 6px;
      padding: 6px;
      border-radius: var(--radius-sm);
    }
    .user-pill:hover { background: var(--color-surface-hover); }
    .user-main {
      display: flex; align-items: center; gap: 10px;
      flex: 1; min-width: 0;
      text-decoration: none; color: inherit;
    }
    .user-avatar, .user-avatar-img {
      width: 30px; height: 30px; border-radius: 50%;
      flex-shrink: 0;
    }
    .user-avatar {
      background: linear-gradient(135deg, var(--color-accent), var(--color-danger));
      display: grid; place-items: center;
      color: #fff; font-weight: 600; font-size: 11px;
    }
    .user-avatar-img { object-fit: cover; border: 1px solid var(--color-border); }
    .user-meta { min-width: 0; flex: 1; }
    .user-name {
      display: block; font-size: 13px; font-weight: 500; color: var(--color-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .user-status {
      display: block; font-size: 11px; color: var(--color-text-faint);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .user-logout {
      flex-shrink: 0;
      width: 30px; height: 30px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 14px;
      transition: background 100ms, color 100ms, border-color 100ms;
    }
    .user-logout:hover {
      background: var(--color-background);
      color: var(--color-danger);
      border-color: var(--color-border);
    }
  `],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly uploads = inject(UploadsService);
  private readonly favoritesStore = inject(FavoritesStore);
  protected readonly language = inject(LanguageService);

  readonly favorites = this.favoritesStore.favorites;

  protected onLangChange(event: Event): void {
    this.language.set((event.target as HTMLSelectElement).value);
  }

  constructor() {
    this.favoritesStore.load();
  }

  protected favRoute(f: { kind: 'LIST' | 'NOTE'; entityId: string }): string {
    return f.kind === 'LIST' ? `/app/lists/${f.entityId}` : '/app/notes';
  }

  protected favParams(f: { kind: 'LIST' | 'NOTE'; entityId: string }): Record<string, string> | null {
    return f.kind === 'NOTE' ? { note: f.entityId } : null;
  }

  readonly userEmail = computed(() => this.auth.user()?.email ?? null);
  readonly isAdmin = computed(() => this.auth.user()?.isAdmin ?? false);
  readonly avatarSrc = computed(() => this.uploads.resolveUrl(this.auth.user()?.avatarUrl ?? null));
  readonly displayName = computed(() => {
    const u = this.auth.user();
    return u?.displayName?.trim() || u?.email?.split('@')[0] || 'Account';
  });
  readonly initials = computed(() => {
    const u = this.auth.user();
    const base = u?.displayName?.trim() || u?.email || '?';
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  });

  readonly mainNav: NavItem[] = [
    { path: '/app', label: 'nav.dashboard', icon: '🏠', exact: true },
    { path: '/app/calendar', label: 'nav.calendar', icon: '📅' },
    { path: '/app/lists', label: 'nav.lists', icon: '🗂️' },
    { path: '/app/notes', label: 'nav.notes', icon: '📝' },
    { path: '/app/todos', label: 'nav.todos', icon: '✓' },
    { path: '/app/habits', label: 'nav.habits', icon: '🔁' },
    { path: '/app/finance', label: 'nav.finance', icon: '💰' },
  ];

  protected openPalette(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
