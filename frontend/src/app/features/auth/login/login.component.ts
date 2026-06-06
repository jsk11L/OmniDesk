import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AnimatedBgComponent } from '../../../shared/components/animated-bg/animated-bg.component';
import type { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, AnimatedBgComponent],
  template: `
    <div class="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <app-animated-bg />
      <div class="relative z-10 w-full max-w-md bg-surface/85 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl">
        <a routerLink="/" class="inline-block mb-6 text-text-muted hover:text-text text-xs">← Back</a>
        <h1 class="text-2xl font-semibold mb-1">OmniDesk</h1>

        @if (challengeToken()) {
          <p class="text-sm text-text-muted mb-6">Enter the 6-digit code from your authenticator app.</p>
          <form (ngSubmit)="verify()" class="space-y-4">
            <label class="block">
              <span class="block text-xs font-medium text-text-muted mb-1.5">Authentication code</span>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                [(ngModel)]="code"
                name="code"
                autofocus
                placeholder="123456 or a backup code"
                class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none tracking-widest"
              />
            </label>

            @if (error()) {
              <p class="text-sm text-danger">{{ error() }}</p>
            }

            <button
              type="submit"
              [disabled]="!code.trim() || loading()"
              class="w-full py-2 rounded bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {{ loading() ? 'Verifying…' : 'Verify' }}
            </button>
            <button
              type="button"
              (click)="cancelChallenge()"
              class="w-full py-2 rounded text-sm text-text-muted hover:text-text"
            >
              ← Use a different account
            </button>
          </form>
        } @else {
          <p class="text-sm text-text-muted mb-6">Sign in to continue</p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <label class="block">
              <span class="block text-xs font-medium text-text-muted mb-1.5">Email</span>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
                placeholder="you@email.com"
              />
            </label>

            <label class="block">
              <span class="block text-xs font-medium text-text-muted mb-1.5">Password</span>
              <input
                type="password"
                formControlName="password"
                autocomplete="current-password"
                class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
                placeholder="••••••••"
              />
            </label>

            @if (error()) {
              <p class="text-sm text-danger">{{ error() }}</p>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full py-2 rounded bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {{ loading() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <p class="text-sm text-text-muted mt-6 text-center">
            Don't have an account?
            <a routerLink="/auth/register" class="text-primary hover:underline">Sign up</a>
          </p>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly challengeToken = signal<string | null>(null);
  protected code = '';

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (result) => {
        if ('requires2FA' in result) {
          this.loading.set(false);
          this.challengeToken.set(result.tempToken);
          return;
        }
        this.onAuthenticated(result.user);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  verify(): void {
    const token = this.challengeToken();
    if (!token || !this.code.trim() || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth.verifyTwoFactor(token, this.code.trim()).subscribe({
      next: (user) => this.onAuthenticated(user),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  cancelChallenge(): void {
    this.challengeToken.set(null);
    this.code = '';
    this.error.set(null);
  }

  private onAuthenticated(user: User): void {
    this.theme.bootstrap(user.activeThemeId);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app';
    void this.router.navigateByUrl(returnUrl);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err.status === 0) return 'Could not connect to the server';
    return 'Invalid credentials';
  }
}
