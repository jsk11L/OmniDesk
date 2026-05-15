import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationsService } from '../services/notifications.service';
import { NotificationPushService } from '../../../core/services/notification-push.service';
import {
  NotificationEditorComponent,
  type NotificationEditorData,
  type NotificationEditorResult,
} from '../notification-editor/notification-editor.component';
import type { InAppNotification, NotificationConfig } from '../notifications.types';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Notificaciones</h1>
          <p class="text-sm text-text-muted">
            Configura recordatorios y suscríbete al push del navegador
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="subscribePush()"
            [disabled]="pushBusy()"
            class="px-3 py-2 rounded text-sm hover:bg-surface-hover"
            title="Activar notificaciones push del navegador"
          >
            🔔 Push: activar
          </button>
          <button
            type="button"
            (click)="createConfig()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            + Nueva
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 class="text-sm font-medium mb-3">Configuraciones</h2>
          @if (loading()) {
            <p class="text-text-muted text-sm">Cargando…</p>
          } @else if (configs().length === 0) {
            <p class="text-text-muted text-sm">
              No tienes configuraciones aún.
            </p>
          } @else {
            <ul class="space-y-2">
              @for (c of configs(); track c.id) {
                <li>
                  <button
                    type="button"
                    (click)="editConfig(c)"
                    class="w-full text-left bg-surface border border-border rounded p-3 hover:border-primary transition-colors"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="w-2 h-2 rounded-full mt-2 shrink-0"
                        [style.background]="c.accentColor"
                      ></span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <h3 class="font-medium truncate">{{ c.title }}</h3>
                          @if (!c.isActive) {
                            <span class="text-xs px-1.5 py-0.5 bg-surface-hover rounded text-text-muted">
                              Inactiva
                            </span>
                          }
                        </div>
                        <p class="text-xs text-text-muted line-clamp-2 mt-0.5">{{ c.message }}</p>
                        <div class="flex items-center gap-2 mt-2 text-xs text-text-muted">
                          <span>{{ triggerLabel(c) }}</span>
                          <span>·</span>
                          <span>{{ c.channels.join(' / ') }}</span>
                          @if (c.lastFiredAt) {
                            <span>·</span>
                            <span>Último: {{ formatDate(c.lastFiredAt) }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              }
            </ul>
          }
        </section>

        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-medium">Inbox</h2>
            @if (inbox().length > 0) {
              <button
                type="button"
                (click)="clearInbox()"
                class="text-xs text-text-muted hover:text-text"
              >
                Limpiar leídas
              </button>
            }
          </div>
          @if (inbox().length === 0) {
            <p class="text-text-muted text-sm">
              No tienes notificaciones in-app sin leer.
            </p>
          } @else {
            <ul class="space-y-2">
              @for (item of inbox(); track item.id) {
                <li
                  class="bg-surface border border-border rounded p-3 flex items-start gap-3"
                >
                  <span
                    class="w-2 h-2 rounded-full mt-2 shrink-0"
                    [style.background]="item.notification?.accentColor ?? '#6366f1'"
                  ></span>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium">{{ item.notification?.title ?? '—' }}</h3>
                    <p class="text-sm text-text-muted">{{ item.notification?.message }}</p>
                    <p class="text-xs text-text-muted mt-1">{{ formatDate(item.createdAt) }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="markAsRead(item.id)"
                    class="text-xs text-primary hover:underline shrink-0"
                  >
                    Marcar leída
                  </button>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    </div>
  `,
})
export class NotificationListComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly push = inject(NotificationPushService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly configs = signal<NotificationConfig[]>([]);
  protected readonly inbox = signal<InAppNotification[]>([]);
  protected readonly pushBusy = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (configs) => {
        this.configs.set(configs);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
      },
    });
    this.service.listInbox().subscribe({
      next: (inbox) => this.inbox.set(inbox),
      error: () => undefined,
    });
  }

  protected createConfig(): void {
    const ref = this.dialog.open<
      NotificationEditorComponent,
      NotificationEditorData,
      NotificationEditorResult
    >(NotificationEditorComponent, { data: {} });
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }

  protected editConfig(config: NotificationConfig): void {
    const ref = this.dialog.open<
      NotificationEditorComponent,
      NotificationEditorData,
      NotificationEditorResult
    >(NotificationEditorComponent, { data: { config } });
    ref.afterClosed().subscribe((result) => {
      if (result) this.reload();
    });
  }

  protected async subscribePush(): Promise<void> {
    this.pushBusy.set(true);
    try {
      await this.push.subscribe();
      this.toastr.success('Push activado');
    } catch (err) {
      this.toastr.error(err instanceof Error ? err.message : 'No se pudo activar');
    } finally {
      this.pushBusy.set(false);
    }
  }

  protected markAsRead(id: string): void {
    this.service.markAsRead(id).subscribe({
      next: () => this.inbox.update((arr) => arr.filter((i) => i.id !== id)),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected clearInbox(): void {
    this.service.clearInbox().subscribe({
      next: () => {
        this.toastr.success('Inbox limpiado');
        this.reload();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected triggerLabel(c: NotificationConfig): string {
    switch (c.triggerType) {
      case 'MANUAL':
        return 'Manual';
      case 'SCHEDULED':
        return c.scheduledAt
          ? `Programada · ${this.formatDate(c.scheduledAt)}`
          : 'Programada';
      case 'RECURRING':
        return c.recurringRule ? `Recurrente · ${c.recurringRule}` : 'Recurrente';
    }
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Error inesperado';
  }
}
