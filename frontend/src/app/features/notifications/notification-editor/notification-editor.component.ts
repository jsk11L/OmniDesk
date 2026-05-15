import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationsService } from '../services/notifications.service';
import type {
  CreateNotificationDto,
  NotificationChannel,
  NotificationConfig,
  NotificationTrigger,
} from '../notifications.types';

export interface NotificationEditorData {
  config?: NotificationConfig;
}

export type NotificationEditorResult =
  | NotificationConfig
  | { deleted: string }
  | undefined;

interface RecurringPreset {
  label: string;
  rule: string;
}

const RECURRING_PRESETS: RecurringPreset[] = [
  { label: 'Diariamente a las 9:00', rule: '0 9 * * *' },
  { label: 'Diariamente a las 18:00', rule: '0 18 * * *' },
  { label: 'Cada lunes a las 9:00', rule: '0 9 * * 1' },
  { label: 'Primer día del mes a las 9:00', rule: '0 9 1 * *' },
  { label: 'Cada hora', rule: '0 * * * *' },
];

@Component({
  selector: 'app-notification-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(600px,95vw)] max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">
        {{ data.config ? 'Editar notificación' : 'Nueva notificación' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Título *</span>
          <input
            type="text"
            formControlName="title"
            maxlength="200"
            autofocus
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
          />
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Mensaje *</span>
          <textarea
            formControlName="message"
            rows="3"
            maxlength="2000"
            class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary resize-y"
          ></textarea>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">URL del ícono</span>
            <input
              type="url"
              formControlName="iconUrl"
              class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              placeholder="https://…"
            />
          </label>
          <label class="block">
            <span class="block text-xs text-text-muted mb-1">Color de acento</span>
            <input
              type="color"
              formControlName="accentColor"
              class="w-full h-10 bg-background border border-border rounded cursor-pointer"
            />
          </label>
        </div>

        <fieldset class="border border-border rounded p-3">
          <legend class="text-xs text-text-muted px-1">Tipo de disparo</legend>
          <div class="space-y-2 mt-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" formControlName="triggerType" value="MANUAL" />
              <span>Manual (la disparas tú con un botón)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" formControlName="triggerType" value="SCHEDULED" />
              <span>Fecha/hora específica</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" formControlName="triggerType" value="RECURRING" />
              <span>Recurrente (cron)</span>
            </label>
          </div>

          @if (form.value.triggerType === 'SCHEDULED') {
            <label class="block mt-3">
              <span class="block text-xs text-text-muted mb-1">Fecha y hora</span>
              <input
                type="datetime-local"
                formControlName="scheduledAt"
                class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
              />
            </label>
          }

          @if (form.value.triggerType === 'RECURRING') {
            <div class="mt-3 space-y-2">
              <label class="block">
                <span class="block text-xs text-text-muted mb-1">Atajos</span>
                <select
                  (change)="applyPreset($event)"
                  class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary"
                >
                  <option value="">— Selecciona un preset o escribe manualmente —</option>
                  @for (p of presets; track p.rule) {
                    <option [value]="p.rule">{{ p.label }}</option>
                  }
                </select>
              </label>
              <label class="block">
                <span class="block text-xs text-text-muted mb-1">
                  Cron string (5 campos: minuto hora día mes día-semana)
                </span>
                <input
                  type="text"
                  formControlName="recurringRule"
                  class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary font-mono text-sm"
                  placeholder="0 9 * * *"
                />
              </label>
            </div>
          }
        </fieldset>

        <fieldset class="border border-border rounded p-3">
          <legend class="text-xs text-text-muted px-1">Enviar por</legend>
          <div class="space-y-2 mt-2">
            @for (ch of allChannels; track ch.value) {
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  [checked]="hasChannel(ch.value)"
                  (change)="toggleChannel(ch.value)"
                  class="accent-primary"
                />
                <span>{{ ch.label }}</span>
              </label>
            }
          </div>
        </fieldset>

        <label class="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" formControlName="isActive" class="accent-primary" />
          <span>Activa</span>
        </label>

        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        <div class="flex justify-between items-center pt-2">
          <div class="flex gap-3 text-sm">
            @if (data.config) {
              <button
                type="button"
                (click)="fireNow()"
                [disabled]="loading()"
                class="text-primary hover:underline"
              >
                Disparar ahora
              </button>
              <button
                type="button"
                (click)="remove()"
                [disabled]="loading()"
                class="text-danger hover:underline"
              >
                Eliminar
              </button>
            }
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              (click)="ref.close()"
              class="px-4 py-2 text-sm rounded hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || loading() || selectedChannels().size === 0"
              class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class NotificationEditorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(NotificationsService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedChannels = signal<Set<NotificationChannel>>(new Set(['IN_APP']));
  protected readonly presets = RECURRING_PRESETS;

  protected readonly allChannels: { value: NotificationChannel; label: string }[] = [
    { value: 'IN_APP', label: 'En la app' },
    { value: 'PUSH', label: 'Push del navegador' },
    { value: 'EMAIL', label: 'Email' },
  ];

  protected readonly form;

  constructor(
    public ref: MatDialogRef<NotificationEditorComponent, NotificationEditorResult>,
    @Inject(MAT_DIALOG_DATA) public data: NotificationEditorData,
  ) {
    const c = data.config;
    if (c) {
      this.selectedChannels.set(new Set(c.channels));
    }

    this.form = this.fb.nonNullable.group({
      title: [c?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      message: [c?.message ?? '', [Validators.required, Validators.maxLength(2000)]],
      iconUrl: [c?.iconUrl ?? ''],
      accentColor: [c?.accentColor ?? '#6366f1'],
      triggerType: [(c?.triggerType ?? 'MANUAL') as NotificationTrigger],
      scheduledAt: [c?.scheduledAt ? this.toLocalInput(new Date(c.scheduledAt)) : ''],
      recurringRule: [c?.recurringRule ?? ''],
      isActive: [c?.isActive ?? true],
    });
  }

  protected hasChannel(c: NotificationChannel): boolean {
    return this.selectedChannels().has(c);
  }

  protected toggleChannel(c: NotificationChannel): void {
    const next = new Set(this.selectedChannels());
    if (next.has(c)) next.delete(c);
    else next.add(c);
    this.selectedChannels.set(next);
  }

  protected applyPreset(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) this.form.controls.recurringRule.setValue(value);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    const raw = this.form.getRawValue();
    const channels = Array.from(this.selectedChannels());
    if (channels.length === 0) {
      this.error.set('Selecciona al menos un canal');
      return;
    }
    if (raw.triggerType === 'SCHEDULED' && !raw.scheduledAt) {
      this.error.set('Especifica la fecha y hora para una notificación programada');
      return;
    }
    if (raw.triggerType === 'RECURRING' && !raw.recurringRule.trim()) {
      this.error.set('Especifica el cron string para una notificación recurrente');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    const payload: CreateNotificationDto = {
      title: raw.title.trim(),
      message: raw.message.trim(),
      iconUrl: raw.iconUrl.trim() || undefined,
      accentColor: raw.accentColor,
      triggerType: raw.triggerType,
      scheduledAt: raw.scheduledAt ? new Date(raw.scheduledAt).toISOString() : undefined,
      recurringRule: raw.recurringRule.trim() || undefined,
      isRecurring: raw.triggerType === 'RECURRING',
      channels,
      isActive: raw.isActive,
    };

    const req$ = this.data.config
      ? this.service.update(this.data.config.id, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: (config) => {
        this.toastr.success(this.data.config ? 'Notificación actualizada' : 'Notificación creada');
        this.ref.close(config);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  fireNow(): void {
    if (!this.data.config || this.loading()) return;
    this.loading.set(true);
    this.service.fire(this.data.config.id).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.toastr.success(
          `Disparada (in-app: ${result.inAppCreated ? '✓' : '−'}, push: ${result.pushSent}, email: ${result.emailsSent})`,
        );
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
  }

  remove(): void {
    if (!this.data.config || this.loading()) return;
    if (!confirm('¿Eliminar esta configuración de notificación?')) return;
    this.loading.set(true);
    this.service.delete(this.data.config.id).subscribe({
      next: ({ id }) => {
        this.toastr.success('Notificación eliminada');
        this.ref.close({ deleted: id });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errMsg(err));
      },
    });
  }

  private toLocalInput(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Error inesperado';
  }
}
