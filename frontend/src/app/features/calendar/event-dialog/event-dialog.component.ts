import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { CalendarService } from '../services/calendar.service';
import { DialogService } from '../../../shared/services/dialog.service';
import type { CalendarEvent } from '../calendar.types';

export interface EventDialogData {
  event?: CalendarEvent;
  defaultStart?: Date;
  defaultEnd?: Date;
}

export type EventDialogResult =
  | { kind: 'created' | 'updated'; event: CalendarEvent }
  | { kind: 'deleted'; id: string };

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(560px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">
        {{ data.event ? 'Edit event' : 'New event' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Title *</span>
          <input
            type="text"
            formControlName="title"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            maxlength="200"
            autofocus
          />
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Description</span>
          <textarea
            formControlName="description"
            rows="2"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
          ></textarea>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Start</span>
            <input
              type="datetime-local"
              formControlName="startDate"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">End</span>
            <input
              type="datetime-local"
              formControlName="endDate"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
            />
          </label>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" formControlName="allDay" class="accent-primary" />
          <span class="text-sm">All day</span>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Color</span>
            <input
              type="color"
              formControlName="color"
              class="w-full h-10 bg-background border border-border rounded cursor-pointer"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Location</span>
            <input
              type="text"
              formControlName="location"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              maxlength="200"
            />
          </label>
        </div>

        @if (data.event?.notifications?.length) {
          <div class="border-t border-border pt-3">
            <p class="text-xs text-text-muted mb-2">Linked notifications:</p>
            <ul class="space-y-1">
              @for (n of data.event!.notifications!; track n.id) {
                <li class="flex items-center justify-between text-sm bg-background px-3 py-1.5 rounded">
                  <span>{{ n.minutesBefore }} min before the event</span>
                  <button
                    type="button"
                    (click)="detachNotification(n.id)"
                    class="text-text-muted hover:text-danger"
                    aria-label="Remove notification"
                  >
                    ×
                  </button>
                </li>
              }
            </ul>
            <p class="text-xs text-text-muted mt-2">
              Link new notifications from the Notifications module.
            </p>
          </div>
        }

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          @if (data.event) {
            <button
              type="button"
              (click)="remove()"
              [disabled]="loading()"
              class="text-sm text-danger hover:underline"
            >
              Delete event
            </button>
          } @else {
            <span></span>
          }
          <div class="flex gap-2">
            <button
              type="button"
              (click)="ref.close()"
              class="px-4 py-2 text-sm rounded hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ loading() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class EventDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CalendarService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form;

  constructor(
    public ref: MatDialogRef<EventDialogComponent, EventDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: EventDialogData,
  ) {
    const event = data.event;
    const start = event ? new Date(event.startDate) : (data.defaultStart ?? new Date());
    const end = event
      ? new Date(event.endDate)
      : (data.defaultEnd ?? new Date(start.getTime() + 60 * 60_000));

    this.form = this.fb.nonNullable.group({
      title: [event?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      description: [event?.description ?? ''],
      startDate: [toLocalInput(start), Validators.required],
      endDate: [toLocalInput(end), Validators.required],
      allDay: [event?.allDay ?? false],
      color: [event?.color ?? '#6366f1'],
      location: [event?.location ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.form.getRawValue();
    const startISO = new Date(raw.startDate).toISOString();
    const endISO = new Date(raw.endDate).toISOString();

    if (new Date(endISO) < new Date(startISO)) {
      this.loading.set(false);
      this.error.set('The end date must be >= the start date');
      return;
    }

    const payload = {
      title: raw.title.trim(),
      description: raw.description?.trim() || undefined,
      startDate: startISO,
      endDate: endISO,
      allDay: raw.allDay,
      color: raw.color,
      location: raw.location?.trim() || undefined,
    };

    const request$ = this.data.event
      ? this.service.update(this.data.event.id, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: (event) => {
        this.toastr.success(this.data.event ? 'Event updated' : 'Event created');
        this.ref.close({ kind: this.data.event ? 'updated' : 'created', event });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.data.event || this.loading()) return;
    const ok = await this.dialogs.confirm({
      title: 'Delete event',
      message: 'Delete this event? This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    this.loading.set(true);
    this.service.delete(this.data.event.id).subscribe({
      next: ({ id }) => {
        this.toastr.success('Event deleted');
        this.ref.close({ kind: 'deleted', id });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  detachNotification(notifId: string): void {
    if (!this.data.event) return;
    this.service.detachNotification(this.data.event.id, notifId).subscribe({
      next: () => {
        this.toastr.success('Notification unlinked');
        if (this.data.event?.notifications) {
          this.data.event.notifications = this.data.event.notifications.filter(
            (n) => n.id !== notifId,
          );
        }
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
