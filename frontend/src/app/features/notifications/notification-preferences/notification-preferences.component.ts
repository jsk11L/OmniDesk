import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { NotificationsService } from '../services/notifications.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <label class="block">
        <span class="block text-xs text-text-muted mb-1">Timezone (reminders fire in your local time)</span>
        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="timezone"
            placeholder="e.g. America/Santiago"
            class="flex-1 px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary"
          />
          <button type="button" (click)="detectTz()" class="px-3 py-2 text-sm rounded border border-border hover:bg-surface-hover whitespace-nowrap">Detect</button>
        </div>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Do-not-disturb from</span>
          <input type="time" [(ngModel)]="dndStart" class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
        </label>
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">to</span>
          <input type="time" [(ngModel)]="dndEnd" class="w-full px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
        </label>
      </div>
      <p class="text-xs text-text-faint -mt-2">Push is muted during this window (the in-app inbox still receives them).</p>

      <div>
        <span class="block text-xs text-text-muted mb-1">Quiet days (no push)</span>
        <div class="flex gap-1">
          @for (d of days; track d.value) {
            <button
              type="button"
              (click)="toggleDay(d.value)"
              [class]="
                'w-9 h-9 rounded-full text-xs font-medium transition-colors ' +
                (quietDays().has(d.value) ? 'bg-danger/20 text-danger' : 'bg-background border border-border text-text-muted hover:text-text')
              "
            >{{ d.label }}</button>
          }
        </div>
      </div>

      <button
        type="button"
        (click)="save()"
        [disabled]="saving()"
        class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
      >
        {{ saving() ? 'Saving…' : 'Save preferences' }}
      </button>
    </div>
  `,
})
export class NotificationPreferencesComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly toastr = inject(ToastrService);

  protected readonly saving = signal(false);
  protected readonly quietDays = signal<Set<number>>(new Set());
  protected timezone = '';
  protected dndStart = '';
  protected dndEnd = '';

  protected readonly days = [
    { value: 1, label: 'M' },
    { value: 2, label: 'T' },
    { value: 3, label: 'W' },
    { value: 4, label: 'T' },
    { value: 5, label: 'F' },
    { value: 6, label: 'S' },
    { value: 0, label: 'S' },
  ];

  ngOnInit(): void {
    this.service.getPreferences().subscribe({
      next: (p) => {
        this.timezone = p.timezone ?? '';
        this.dndStart = p.dndStart ?? '';
        this.dndEnd = p.dndEnd ?? '';
        this.quietDays.set(new Set(p.quietDays ?? []));
      },
      error: () => undefined,
    });
  }

  protected detectTz(): void {
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  }

  protected toggleDay(day: number): void {
    const next = new Set(this.quietDays());
    next.has(day) ? next.delete(day) : next.add(day);
    this.quietDays.set(next);
  }

  protected save(): void {
    this.saving.set(true);
    this.service
      .updatePreferences({
        timezone: this.timezone.trim() || undefined,
        dndStart: this.dndStart || null,
        dndEnd: this.dndEnd || null,
        quietDays: Array.from(this.quietDays()),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toastr.success('Preferences saved');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const body = err.error as { error?: { message?: string | string[] } } | null;
          const m = body?.error?.message;
          this.toastr.error(Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Could not save');
        },
      });
  }
}
