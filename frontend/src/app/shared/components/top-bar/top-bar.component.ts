import { ChangeDetectionStrategy, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { NotificationsService } from '../../../features/notifications/services/notifications.service';

const LABELS: Record<string, string> = {
  '': 'Dashboard',
  calendar: 'Calendar',
  lists: 'Lists',
  notes: 'Notes',
  todos: 'TO-DO',
  habits: 'Habits',
  finance: 'Finance',
  notifications: 'Notifications',
  settings: 'Settings',
  admin: 'Admin',
  organizer: 'Organizer',
  import: 'Import',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

@Component({
  selector: 'app-top-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header
      class="h-12 shrink-0 flex items-center gap-2 px-4 sm:px-6 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-20"
    >
      <button
        type="button"
        (click)="menu.emit()"
        class="lg:hidden p-2 -ml-1 rounded hover:bg-surface-hover text-text-muted hover:text-text"
        aria-label="Open menu"
      >
        ☰
      </button>

      <nav class="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
        @for (c of crumbs(); track c; let last = $last) {
          <span [class]="last ? 'text-text font-medium truncate' : 'text-text-muted shrink-0'">{{ c }}</span>
          @if (!last) { <span class="text-text-faint shrink-0">/</span> }
        }
      </nav>

      <div class="flex-1"></div>

      <button
        type="button"
        (click)="openPalette()"
        class="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-border bg-surface-2 text-text-muted hover:text-text hover:border-primary text-xs transition-colors w-48"
        title="Search (Ctrl/⌘ K)"
      >
        <span class="text-sm leading-none">🔍</span>
        <span class="flex-1 text-left">Search or run…</span>
        <kbd class="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">⌘K</kbd>
      </button>

      <a
        routerLink="/app/notifications"
        class="relative p-2.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text"
        title="Notifications"
      >
        <span class="text-lg leading-none">🔔</span>
        @if (unread() > 0) {
          <span class="absolute top-1 right-1 min-w-4 h-4 px-1 bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {{ unread() > 9 ? '9+' : unread() }}
          </span>
        }
      </a>
    </header>
  `,
})
export class TopBarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationsService);

  readonly menu = output<void>();
  protected readonly unread = signal(0);

  protected readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.computeCrumbs()),
      startWith(this.computeCrumbs()),
    ),
    { initialValue: this.computeCrumbs() },
  );

  ngOnInit(): void {
    this.notifications.listInbox().subscribe({
      next: (inbox) => this.unread.set(inbox.filter((i) => !i.isRead).length),
      error: () => undefined,
    });
  }

  protected openPalette(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  }

  private computeCrumbs(): string[] {
    const path = this.router.url.split('?')[0].split('#')[0];
    const parts = path.split('/').filter(Boolean); // e.g. ['app','finance','organizer']
    const afterApp = parts[0] === 'app' ? parts.slice(1) : parts;
    if (afterApp.length === 0) return ['Dashboard'];
    return afterApp.map((seg) => LABELS[seg] ?? (UUID.test(seg) ? 'Detail' : capitalize(seg)));
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
