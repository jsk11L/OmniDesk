import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

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

      <div class="border-t border-border p-3">
        @for (item of footerNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-surface-hover text-text"
            class="block px-3 py-2 rounded text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            {{ item.label }}
          </a>
        }
        <button
          type="button"
          (click)="logout()"
          class="w-full text-left mt-2 px-3 py-2 rounded text-sm text-text-muted hover:text-danger hover:bg-surface-hover transition-colors"
        >
          {{ userEmail() ?? 'Sign out' }}
          <span class="block text-xs opacity-60">Sign out</span>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly userEmail = computed(() => this.auth.user()?.email ?? null);

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
