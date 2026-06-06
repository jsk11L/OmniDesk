import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { AnimatedBgComponent } from '../../../shared/components/animated-bg/animated-bg.component';
import { PasswordInputComponent } from '../../../shared/components/password-input/password-input.component';
import { CaptchaComponent } from '../../../shared/components/captcha/captcha.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AnimatedBgComponent, PasswordInputComponent, CaptchaComponent],
  template: `
    <div class="relative min-h-screen flex items-center justify-center bg-background px-4 py-8 overflow-hidden">
      <app-animated-bg />
      <div class="relative z-10 w-full max-w-md bg-surface/85 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl">
        <a routerLink="/" class="inline-block mb-6 text-text-muted hover:text-text text-xs">← Back</a>
        <h1 class="text-2xl font-semibold mb-1">Create account</h1>
        <p class="text-sm text-text-muted mb-6">Start your personal organizer</p>

        @if (success()) {
          <div class="bg-success/10 border border-success/30 rounded p-4 mb-4">
            <p class="text-sm text-success font-medium">{{ success() }}</p>
            <p class="text-xs text-text-muted mt-2">
              Check your inbox (or the backend console in dev mode) and click the
              verification link to activate your account.
            </p>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block">
            <span class="block text-xs font-medium text-text-muted mb-1.5">Name (optional)</span>
            <input
              type="text"
              formControlName="displayName"
              autocomplete="name"
              class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
              placeholder="Your name"
            />
          </label>

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

          <div class="block">
            <span class="block text-xs font-medium text-text-muted mb-1.5">Password</span>
            <app-password-input
              [showChecks]="true"
              autocomplete="new-password"
              (valueChange)="onPasswordChange($event)"
              (validChange)="onPasswordValidChange($event)"
            />
          </div>

          <label class="flex items-start gap-2 text-xs text-text-muted cursor-pointer">
            <input type="checkbox" formControlName="acceptedTerms" class="mt-0.5 accent-primary" />
            <span>
              I accept the
              <a routerLink="/legal/terms" target="_blank" class="text-primary hover:underline">Terms of Service</a>
              and
              <a routerLink="/legal/privacy" target="_blank" class="text-primary hover:underline">Privacy Policy</a>.
            </span>
          </label>

          <label class="flex items-start gap-2 text-xs text-text-muted cursor-pointer">
            <input type="checkbox" formControlName="acceptedNoDataSelling" class="mt-0.5 accent-primary" />
            <span>I understand OmniDesk <strong>never sells my data</strong> and has no SLA.</span>
          </label>

          <app-captcha (token)="captchaToken.set($event)" />

          @if (error()) {
            <p class="text-sm text-danger">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="!canSubmit() || loading()"
            class="w-full py-2 rounded bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>
        </form>

        <p class="text-sm text-text-muted mt-6 text-center">
          Already have an account?
          <a routerLink="/auth/login" class="text-primary hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  private readonly captcha = viewChild(CaptchaComponent);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly password = signal('');
  protected readonly passwordValid = signal(false);
  protected readonly captchaToken = signal<string | null>(null);
  protected readonly captchaEnabled = !!environment.captchaSiteKey;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', [Validators.maxLength(100)]],
    acceptedTerms: [false, [Validators.requiredTrue]],
    acceptedNoDataSelling: [false, [Validators.requiredTrue]],
  });

  protected canSubmit(): boolean {
    return (
      this.form.valid &&
      this.passwordValid() &&
      (!this.captchaEnabled || !!this.captchaToken())
    );
  }

  protected onPasswordChange(value: string): void {
    this.password.set(value);
  }

  protected onPasswordValidChange(valid: boolean): void {
    this.passwordValid.set(valid);
  }

  submit(): void {
    if (!this.canSubmit() || this.loading()) return;
    this.error.set(null);
    this.success.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    this.auth
      .register({
        email: raw.email,
        password: this.password(),
        displayName: raw.displayName.trim() || undefined,
        acceptedTerms: raw.acceptedTerms,
        acceptedNoDataSelling: raw.acceptedNoDataSelling,
        captchaToken: this.captchaToken() ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.success.set(res.message);
          this.form.reset();
          this.password.set('');
          this.passwordValid.set(false);
          this.captchaToken.set(null);
          this.captcha()?.reset();
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.captchaToken.set(null);
          this.captcha()?.reset();
          this.error.set(this.extractErrorMessage(err));
        },
      });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err.status === 0) return 'Could not connect to the server';
    return 'Could not create the account';
  }
}
