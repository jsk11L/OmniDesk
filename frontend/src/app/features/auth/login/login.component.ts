import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AnimatedBgComponent } from '../../../shared/components/animated-bg/animated-bg.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AnimatedBgComponent],
  template: `
    <div class="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <app-animated-bg />
      <div class="relative z-10 w-full max-w-md bg-surface/85 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl">
        <a routerLink="/" class="inline-block mb-6 text-text-muted hover:text-text text-xs">← Volver</a>
        <h1 class="text-2xl font-semibold mb-1">OmniDesk</h1>
        <p class="text-sm text-text-muted mb-6">Inicia sesión para continuar</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block">
            <span class="block text-xs font-medium text-text-muted mb-1.5">Email</span>
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
              placeholder="tu@email.com"
            />
          </label>

          <label class="block">
            <span class="block text-xs font-medium text-text-muted mb-1.5">Contraseña</span>
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
            {{ loading() ? 'Ingresando…' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="text-sm text-text-muted mt-6 text-center">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="text-primary hover:underline">Regístrate</a>
        </p>
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
      next: (user) => {
        this.theme.bootstrap(user.activeThemeId);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err.status === 0) return 'No se pudo conectar al servidor';
    return 'Credenciales inválidas';
  }
}
