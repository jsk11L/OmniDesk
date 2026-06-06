import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import {
  AttachedNotification,
  AttachEntityType,
  NotificationsService,
} from '../../../features/notifications/services/notifications.service';
import type { NotificationConfig } from '../../../features/notifications/notifications.types';

@Component({
  selector: 'app-notification-attach-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="space-y-2">
      <p class="text-xs font-medium text-text-muted">Reminders</p>

      @if (attached().length) {
        <ul class="space-y-1">
          @for (a of attached(); track a.id) {
            <li class="flex items-center justify-between text-sm bg-background border border-border rounded px-2 py-1.5">
              <span class="truncate">
                {{ a.notification.title }}
                @if (timingLabel(a); as t) { <span class="text-xs text-text-muted">· {{ t }}</span> }
              </span>
              <button type="button" (click)="detach(a)" class="text-text-muted hover:text-danger text-xs ml-2" aria-label="Remove reminder">×</button>
            </li>
          }
        </ul>
      } @else {
        <p class="text-xs text-text-faint">No reminders attached yet.</p>
      }

      @if (available().length) {
        <div class="flex flex-wrap items-end gap-2 pt-1">
          <select [(ngModel)]="selectedId" class="px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary">
            <option value="">Choose a notification…</option>
            @for (c of available(); track c.id) {
              <option [value]="c.id">{{ c.title }}</option>
            }
          </select>

          @switch (entityType()) {
            @case ('todo-item') {
              <input type="number" min="0" [(ngModel)]="minutesBefore" placeholder="min before" class="w-24 px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
            }
            @case ('habit') {
              <input type="time" [(ngModel)]="timeOfDay" class="px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
            }
            @case ('planned-purchase') {
              <input type="number" min="0" [(ngModel)]="daysBefore" placeholder="days before" class="w-24 px-2 py-1.5 bg-background border border-border rounded text-sm outline-none focus:border-primary" />
            }
          }

          <button type="button" [disabled]="!selectedId || busy()" (click)="attach()" class="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
            Attach
          </button>
        </div>
      } @else if (configs().length === 0) {
        <p class="text-xs text-text-faint">Create a notification first (Notifications page), then attach it here.</p>
      }
    </div>
  `,
})
export class NotificationAttachPanelComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly toastr = inject(ToastrService);

  readonly entityType = input.required<AttachEntityType>();
  readonly entityId = input.required<string>();

  protected readonly attached = signal<AttachedNotification[]>([]);
  protected readonly configs = signal<NotificationConfig[]>([]);
  protected readonly busy = signal(false);
  protected selectedId = '';
  protected minutesBefore: number | null = null;
  protected timeOfDay = '';
  protected daysBefore: number | null = null;

  protected readonly available = computed(() => {
    const taken = new Set(this.attached().map((a) => a.notificationId));
    return this.configs().filter((c) => !taken.has(c.id));
  });

  ngOnInit(): void {
    this.service.list().subscribe({ next: (c) => this.configs.set(c), error: () => undefined });
    this.reloadAttached();
  }

  private reloadAttached(): void {
    this.service.listTargets(this.entityType(), this.entityId()).subscribe({
      next: (a) => this.attached.set(a),
      error: () => undefined,
    });
  }

  protected timingLabel(a: AttachedNotification): string | null {
    if (a.minutesBefore != null) return `${a.minutesBefore} min before`;
    if (a.timeOfDay) return `at ${a.timeOfDay}`;
    if (a.daysBefore != null) return `${a.daysBefore} days before`;
    return null;
  }

  protected attach(): void {
    if (!this.selectedId) return;
    this.busy.set(true);
    this.service
      .attachTarget(this.entityType(), this.entityId(), {
        notificationId: this.selectedId,
        minutesBefore: this.minutesBefore ?? undefined,
        timeOfDay: this.timeOfDay || undefined,
        daysBefore: this.daysBefore ?? undefined,
      })
      .subscribe({
        next: (a) => {
          this.busy.set(false);
          this.attached.update((arr) => [...arr, a]);
          this.selectedId = '';
          this.minutesBefore = null;
          this.timeOfDay = '';
          this.daysBefore = null;
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          this.toastr.error(this.msg(err));
        },
      });
  }

  protected detach(a: AttachedNotification): void {
    this.service.detachTarget(this.entityType(), this.entityId(), a.notificationId).subscribe({
      next: () => this.attached.update((arr) => arr.filter((x) => x.id !== a.id)),
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const m = body?.error?.message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
    return 'Something went wrong';
  }
}
