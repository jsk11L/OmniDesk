import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { AnimatedBgComponent } from '../../../shared/components/animated-bg/animated-bg.component';

@Component({
  selector: 'app-restore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AnimatedBgComponent],
  template: `
    <div class="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <app-animated-bg />
      <div class="relative z-10 w-full max-w-md bg-surface/85 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl text-center">
        <h1 class="text-2xl font-semibold mb-4">Restore account</h1>

        @if (state() === 'loading') {
          <p class="text-text-muted">Restoring your account…</p>
        } @else if (state() === 'success') {
          <div class="bg-success/10 border border-success/30 rounded p-4 mb-4">
            <p class="text-sm text-success font-medium">{{ message() }}</p>
          </div>
          <a routerLink="/auth/login" class="text-primary hover:underline text-sm">Go to sign in →</a>
        } @else {
          <div class="bg-danger/10 border border-danger/30 rounded p-4 mb-4">
            <p class="text-sm text-danger">{{ message() }}</p>
          </div>
          <a routerLink="/auth/login" class="text-primary hover:underline text-sm">Back to sign in</a>
        }
      </div>
    </div>
  `,
})
export class RestoreComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.message.set('Missing restore token.');
      return;
    }
    this.auth.restoreAccount(token).subscribe({
      next: (res) => {
        this.state.set('success');
        this.message.set(res.message);
      },
      error: (err: HttpErrorResponse) => {
        this.state.set('error');
        const body = err.error as { error?: { message?: string } } | null;
        this.message.set(body?.error?.message ?? 'This restore link is invalid or has expired.');
      },
    });
  }
}
