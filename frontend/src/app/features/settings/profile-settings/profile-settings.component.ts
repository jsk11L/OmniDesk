import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-xl">
      @if (user(); as u) {
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Email</span>
            <input
              type="email"
              [value]="u.email"
              disabled
              class="w-full px-3 py-2 bg-background border border-border rounded text-text-muted"
            />
            <p class="text-xs text-text-muted mt-1">
              @if (u.isEmailVerified) {
                ✓ Verificado
              } @else {
                Pendiente de verificación
              }
            </p>
          </label>

          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Nombre para mostrar</span>
            <input
              type="text"
              formControlName="displayName"
              maxlength="100"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              placeholder="Tu nombre"
            />
          </label>

          <label class="block">
            <span class="block text-xs text-text-muted mb-1">URL de avatar</span>
            <input
              type="url"
              formControlName="avatarUrl"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              placeholder="https://…"
            />
            @if (avatarPreview()) {
              <img
                [src]="avatarPreview()"
                alt="Avatar preview"
                class="mt-2 w-20 h-20 rounded-full object-cover border border-border"
              />
            }
          </label>

          @if (error()) {
            <p class="text-sm text-danger">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || saving()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      } @else {
        <p class="text-text-muted">Cargando perfil…</p>
      }
    </div>
  `,
})
export class ProfileSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly settings = inject(SettingsService);
  private readonly toastr = inject(ToastrService);

  protected readonly user = this.auth.user;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly avatarPreview = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.maxLength(100)]],
    avatarUrl: [''],
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        displayName: u.displayName ?? '',
        avatarUrl: u.avatarUrl ?? '',
      });
      this.avatarPreview.set(u.avatarUrl);
    }
    this.form.controls.avatarUrl.valueChanges.subscribe((url) => {
      this.avatarPreview.set(url && url.trim().length > 0 ? url : null);
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.error.set(null);
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: { displayName?: string; avatarUrl?: string } = {};
    if (raw.displayName.trim()) payload.displayName = raw.displayName.trim();
    if (raw.avatarUrl.trim()) payload.avatarUrl = raw.avatarUrl.trim();

    this.settings.updateProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.auth.fetchMe().subscribe();
        this.toastr.success('Perfil actualizado');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        if (Array.isArray(msg)) this.error.set(msg.join('. '));
        else if (typeof msg === 'string') this.error.set(msg);
        else this.error.set('No se pudo actualizar el perfil');
      },
    });
  }
}
