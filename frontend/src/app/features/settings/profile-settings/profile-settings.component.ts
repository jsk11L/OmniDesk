import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../services/settings.service';
import { ImageInputComponent } from '../../../shared/components/image-input/image-input.component';
import { UploadsService } from '../../../shared/services/uploads.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ImageInputComponent],
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
                ✓ Verified
              } @else {
                Pending verification
              }
            </p>
          </label>

          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Display name</span>
            <input
              type="text"
              formControlName="displayName"
              maxlength="100"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              placeholder="Your name"
            />
          </label>

          <div>
            <span class="block text-xs text-text-muted mb-1">Avatar</span>
            <div class="flex gap-4 items-start">
              @if (avatarPreview()) {
                <img
                  [src]="avatarPreview()!"
                  alt="Avatar"
                  class="w-20 h-20 rounded-full object-cover border border-border shrink-0"
                />
              }
              <div class="flex-1">
                <app-image-input
                  [initialValue]="avatarUrl()"
                  (valueChange)="onAvatarChange($event)"
                />
              </div>
            </div>
          </div>

          @if (error()) {
            <p class="text-sm text-danger">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || saving()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {{ saving() ? 'Saving…' : 'Save changes' }}
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
  private readonly uploads = inject(UploadsService);
  private readonly toastr = inject(ToastrService);

  protected readonly user = this.auth.user;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly avatarUrl = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.maxLength(100)]],
  });

  protected avatarPreview(): string | null {
    return this.uploads.resolveUrl(this.avatarUrl());
  }

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.form.patchValue({ displayName: u.displayName ?? '' });
      this.avatarUrl.set(u.avatarUrl ?? null);
    }
  }

  protected onAvatarChange(url: string | null): void {
    this.avatarUrl.set(url);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.error.set(null);
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: { displayName?: string; avatarUrl?: string } = {};
    if (raw.displayName.trim()) payload.displayName = raw.displayName.trim();
    const url = this.avatarUrl();
    if (url) payload.avatarUrl = url;

    this.settings.updateProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.auth.fetchMe().subscribe();
        this.toastr.success('Profile updated');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        if (Array.isArray(msg)) this.error.set(msg.join('. '));
        else if (typeof msg === 'string') this.error.set(msg);
        else this.error.set('Could not update the profile');
      },
    });
  }
}
