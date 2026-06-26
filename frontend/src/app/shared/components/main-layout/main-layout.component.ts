import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, TopBarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background text-text">
      <!-- Static sidebar on large screens -->
      <div class="hidden lg:flex h-full">
        <app-sidebar />
      </div>

      <!-- Off-canvas drawer on mobile -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 lg:hidden" (click)="sidebarOpen.set(false)">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div class="relative h-full w-fit shadow-2xl" (click)="$event.stopPropagation()">
            <app-sidebar />
          </div>
        </div>
      }

      <div class="flex-1 flex flex-col min-w-0 h-full">
        <app-top-bar (menu)="sidebarOpen.set(true)" />
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  protected readonly sidebarOpen = signal(false);

  constructor() {
    // Close the mobile drawer after any navigation.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.sidebarOpen.set(false));
  }
}
