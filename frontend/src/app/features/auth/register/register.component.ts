import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-md bg-surface border border-border rounded p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold mb-1">Crear cuenta</h1>
        <p class="text-sm text-text-muted mb-6">Comienza tu organizador personal</p>

        @if (success()) {
          <div class="bg-success/10 border border-success/30 rounded p-4 mb-4">
            <p class="text-sm text-success font-medium">{{ success() }}</p>
            <p class="text-xs text-text-muted mt-2">
              Revisa tu casilla de correo (o la consola del backend en modo dev) y haz clic en el
              enlace de verificación para activar la cuenta.
            </p>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block">
            <span class="block text-xs font-medium text-text-muted mb-1.5">Nombre (opcional)</span>
            <input
              type="text"
              formControlName="displayName"
              autocomplete="name"
              class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
              placeholder="Tu nombre"
            />
          </label>

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
            <span class="block text-xs font-medium text-text-muted mb-1.5">
              Contraseña (mínimo 8 caracteres)
            </span>
            <input
              type="password"
              formControlName="password"
              autocomplete="new-password"
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
            {{ loading() ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="text-sm text-text-muted mt-6 text-center">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="text-primary hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    displayName: ['', [Validators.maxLength(100)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.success.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const payload: { email: string; password: string; displayName?: string } = {
      email: raw.email,
      password: raw.password,
    };
    if (raw.displayName.trim()) {
      payload.displayName = raw.displayName.trim();
    }

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message);
        this.form.reset();
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
    return 'No se pudo crear la cuenta';
  }
}
