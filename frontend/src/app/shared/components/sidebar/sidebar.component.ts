import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UploadsService } from '../../services/uploads.service';

interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="w-[260px] shrink-0 bg-surface border-r border-border flex flex-col h-full"
    >
      <div class="px-5 py-4 border-b border-border">
        <h1 class="text-lg font-semibold tracking-tight">OmniDesk</h1>
      </div>

      <nav class="flex-1 p-2 overflow-y-auto">
        @for (item of mainNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-surface-hover text-text"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="block px-3 py-2 rounded text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="border-t border-border p-3 space-y-1">
        <a
          routerLink="/app/settings"
          routerLinkActive="bg-surface-hover"
          class="flex items-center gap-3 px-3 py-2 rounded hover:bg-surface-hover transition-colors"
          title="Profile & settings"
        >
          @if (avatarSrc(); as src) {
            <img
              [src]="src"
              alt=""
              class="w-9 h-9 rounded-full object-cover border border-border shrink-0"
            />
          } @else {
            <span
              class="w-9 h-9 rounded-full bg-surface-hover text-text flex items-center justify-center text-sm font-semibold shrink-0"
            >
              {{ initials() }}
            </span>
          }
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-text truncate">{{ displayName() }}</span>
            <span class="block text-xs text-text-muted truncate">{{ userEmail() }}</span>
          </span>
        </a>

        @for (item of footerNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-surface-hover text-text"
            class="block px-3 py-2 rounded text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            {{ item.label }}
          </a>
        }
        @if (isAdmin()) {
          <a
            routerLink="/app/admin"
            routerLinkActive="bg-surface-hover text-text"
            class="block px-3 py-2 rounded text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            Admin
          </a>
        }
        <button
          type="button"
          (click)="logout()"
          class="w-full text-left mt-1 px-3 py-2 rounded text-sm text-text-muted hover:text-danger hover:bg-surface-hover transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly uploads = inject(UploadsService);

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
    { path: '/app', label: 'Dashboard', exact: true },
    { path: '/app/calendar', label: 'Calendar' },
    { path: '/app/lists', label: 'Lists' },
    { path: '/app/notes', label: 'Notes' },
    { path: '/app/todos', label: 'TO-DO' },
    { path: '/app/habits', label: 'Habits' },
    { path: '/app/finance', label: 'Finance' },
  ];

  readonly footerNav: NavItem[] = [
    { path: '/app/notifications', label: 'Notifications' },
    { path: '/app/settings', label: 'Settings' },
  ];

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
