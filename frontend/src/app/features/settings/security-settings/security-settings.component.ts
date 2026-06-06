import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { AuthService, TwoFactorSetup } from '../../../core/services/auth.service';
import { UploadsService, UploadUsage } from '../../../shared/services/uploads.service';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl space-y-8">
      <!-- Storage usage -->
      <section>
        <h2 class="text-sm font-semibold mb-3">Storage</h2>
        @if (usage(); as u) {
          <div class="flex items-center justify-between text-sm mb-1">
            <span>{{ formatBytes(u.used) }} of {{ formatBytes(u.quota) }} used</span>
            <span class="text-text-muted">{{ u.percent }}%</span>
          </div>
          <div class="w-full h-2 bg-surface rounded overflow-hidden">
            <div
              class="h-full transition-all"
              [style.width.%]="u.percent"
              [style.background]="u.percent >= 100 ? 'var(--color-danger)' : 'var(--color-primary)'"
            ></div>
          </div>
          @if (u.percent >= 100) {
            <p class="text-xs text-danger mt-1">You're out of storage. Delete some images to upload more.</p>
          }
        } @else {
          <p class="text-text-muted text-sm">Loading usage…</p>
        }
      </section>

      <!-- Two-factor -->
      <section>
        <h2 class="text-sm font-semibold mb-3">Two-factor authentication</h2>
        @if (twoFaEnabled()) {
          <p class="text-sm text-success mb-3">✓ Two-factor authentication is enabled.</p>
          <div class="flex gap-2">
            <button type="button" (click)="regenerate()" class="px-3 py-1.5 text-sm rounded border border-border hover:bg-surface-hover">
              Regenerate backup codes
            </button>
            <button type="button" (click)="disable()" class="px-3 py-1.5 text-sm rounded text-danger hover:bg-surface-hover">
              Disable 2FA
            </button>
          </div>
        } @else if (setup(); as s) {
          <p class="text-sm text-text-muted mb-3">Scan this QR with your authenticator app, then enter the 6-digit code to confirm.</p>
          <img [src]="s.qrDataUrl" alt="2FA QR code" class="w-44 h-44 rounded bg-white p-2 mb-2" />
          <p class="text-xs text-text-muted mb-3">Can't scan? Secret: <code class="bg-surface px-1.5 py-0.5 rounded">{{ s.secret }}</code></p>
          <div class="flex gap-2 items-center">
            <input
              type="text"
              inputmode="numeric"
              [(ngModel)]="code"
              placeholder="123456"
              class="px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary w-32 tracking-widest"
            />
            <button type="button" [disabled]="!code.trim() || busy()" (click)="confirmEnable()" class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {{ busy() ? 'Enabling…' : 'Confirm' }}
            </button>
            <button type="button" (click)="cancelSetup()" class="px-3 py-1.5 text-sm rounded hover:bg-surface-hover">Cancel</button>
          </div>
        } @else {
          <p class="text-sm text-text-muted mb-3">Add a second step at sign-in with an authenticator app (TOTP).</p>
          <button type="button" [disabled]="busy()" (click)="startSetup()" class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
            Enable 2FA
          </button>
        }

        @if (backupCodes(); as codes) {
          <div class="mt-4 border border-border rounded p-3 bg-surface">
            <p class="text-sm font-medium mb-2">Save your backup codes</p>
            <p class="text-xs text-text-muted mb-2">Each can be used once if you lose your device. They won't be shown again.</p>
            <div class="grid grid-cols-2 gap-1 font-mono text-sm">
              @for (c of codes; track c) { <span>{{ c }}</span> }
            </div>
            <button type="button" (click)="backupCodes.set(null)" class="mt-3 text-xs text-primary hover:underline">I've saved them</button>
          </div>
        }
      </section>

      <!-- Danger zone -->
      <section>
        <h2 class="text-sm font-semibold mb-3 text-danger">Danger zone</h2>
        <p class="text-sm text-text-muted mb-3">
          Deleting your account schedules it for permanent removal. You'll get an email with a link to
          restore it within the grace period.
        </p>
        <button type="button" (click)="deleteAccount()" class="px-3 py-1.5 text-sm rounded border border-danger text-danger hover:bg-danger/10">
          Delete my account
        </button>
      </section>
    </div>
  `,
})
export class SecuritySettingsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly uploads = inject(UploadsService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly usage = signal<UploadUsage | null>(null);
  protected readonly twoFaEnabled = signal(false);
  protected readonly setup = signal<TwoFactorSetup | null>(null);
  protected readonly backupCodes = signal<string[] | null>(null);
  protected readonly busy = signal(false);
  protected code = '';

  ngOnInit(): void {
    this.uploads.usage().subscribe({ next: (u) => this.usage.set(u), error: () => undefined });
    this.auth.twoFactorStatus().subscribe({
      next: (s) => this.twoFaEnabled.set(s.enabled),
      error: () => undefined,
    });
  }

  startSetup(): void {
    this.busy.set(true);
    this.auth.twoFactorSetup().subscribe({
      next: (s) => {
        this.busy.set(false);
        this.setup.set(s);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toastr.error(this.msg(err));
      },
    });
  }

  confirmEnable(): void {
    if (!this.code.trim()) return;
    this.busy.set(true);
    this.auth.twoFactorEnable(this.code.trim()).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.setup.set(null);
        this.code = '';
        this.twoFaEnabled.set(true);
        this.backupCodes.set(res.backupCodes);
        this.toastr.success('Two-factor enabled');
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toastr.error(this.msg(err));
      },
    });
  }

  cancelSetup(): void {
    this.setup.set(null);
    this.code = '';
  }

  async disable(): Promise<void> {
    const code = await this.dialogs.prompt({
      title: 'Disable two-factor',
      label: 'Enter a current code or a backup code to confirm',
      confirmLabel: 'Disable',
    });
    if (!code?.trim()) return;
    this.auth.twoFactorDisable(code.trim()).subscribe({
      next: () => {
        this.twoFaEnabled.set(false);
        this.toastr.success('Two-factor disabled');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  async regenerate(): Promise<void> {
    const code = await this.dialogs.prompt({
      title: 'Regenerate backup codes',
      label: 'Enter a current code to confirm',
      confirmLabel: 'Regenerate',
    });
    if (!code?.trim()) return;
    this.auth.twoFactorRegenerate(code.trim()).subscribe({
      next: (res) => {
        this.backupCodes.set(res.backupCodes);
        this.toastr.success('New backup codes generated');
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  async deleteAccount(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Delete account',
      message:
        'This schedules your account and all data for permanent deletion. You can restore it from the email link during the grace period. Continue?',
      confirmLabel: 'Continue',
      destructive: true,
    });
    if (!confirmed) return;
    const password = await this.dialogs.prompt({
      title: 'Confirm with your password',
      label: 'Password',
      inputType: 'password',
      confirmLabel: 'Delete my account',
    });
    if (!password) return;
    this.auth.deleteAccount(password).subscribe({
      next: (res) => {
        this.toastr.success(res.message);
        this.auth.logout();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  protected formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
  }

  private msg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const m = body?.error?.message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
    return 'Something went wrong';
  }
}
