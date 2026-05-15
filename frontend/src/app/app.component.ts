import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommandPaletteComponent],
  template: `
    <router-outlet />
    <app-command-palette />
  `,
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.auth.bootstrap().subscribe({
      next: (user) => {
        if (user) {
          this.theme.bootstrap(user.activeThemeId);
        }
      },
    });
  }
}
