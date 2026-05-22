import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core';
import { ToastrService } from 'ngx-toastr';

import { CalendarService } from './services/calendar.service';
import {
  EventDialogComponent,
  type EventDialogData,
  type EventDialogResult,
} from './event-dialog/event-dialog.component';
import {
  CalendarSettingsDialogComponent,
  type CalendarSettingsDialogData,
  type CalendarSettingsDialogResult,
} from './calendar-settings-dialog/calendar-settings-dialog.component';
import type { CalendarEvent, CalendarSettings } from './calendar.types';

interface SlotMenu {
  visible: boolean;
  x: number;
  y: number;
  start: Date | null;
  end: Date | null;
  eventsAtSlot: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FullCalendarModule],
  template: `
    <div class="h-full flex flex-col" [class.rounded]="rounded()">
      <header class="px-6 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold">Calendario</h1>
          <p class="text-xs text-text-muted">Click en un slot para crear o ver eventos.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="openCreate()"
            class="px-3 py-1.5 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            + Nuevo
          </button>
          <button
            type="button"
            (click)="openSettings()"
            class="px-3 py-1.5 rounded hover:bg-surface-hover text-sm"
            title="Configuración"
          >
            ⚙
          </button>
        </div>
      </header>

      <div class="flex-1 p-4 overflow-auto" [style.max-height]="containerHeight()">
        <full-calendar [options]="calendarOptions"></full-calendar>
      </div>

      @if (slotMenu().visible) {
        <div
          class="slot-menu"
          [style.left.px]="slotMenu().x"
          [style.top.px]="slotMenu().y"
          (click)="$event.stopPropagation()"
        >
          <button type="button" (click)="createFromSlot()">+ Crear evento</button>
          @if (slotMenu().eventsAtSlot.length > 0) {
            <hr />
            <p class="menu-section">Eventos en este slot</p>
            @for (e of slotMenu().eventsAtSlot; track e.id) {
              <button type="button" (click)="editEvent(e)" class="event-item">
                <span class="dot" [style.background-color]="e.color"></span>
                <span class="title">{{ e.title }}</span>
              </button>
            }
          }
        </div>
        <div class="slot-menu-backdrop" (click)="closeSlotMenu()"></div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .slot-menu {
      position: fixed;
      z-index: 100;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      padding: 0.25rem;
      min-width: 220px;
      max-width: 320px;
    }
    .slot-menu button {
      width: 100%;
      text-align: left;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .slot-menu button:hover { background: var(--color-surface-hover); }
    .slot-menu hr { border: 0; border-top: 1px solid var(--color-border); margin: 0.25rem 0; }
    .menu-section {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem 0.25rem;
    }
    .event-item { display: flex; align-items: center; gap: 0.5rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .slot-menu-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
    }

    ::ng-deep .fc {
      --fc-border-color: var(--color-border);
      --fc-page-bg-color: var(--color-background);
      --fc-neutral-bg-color: var(--color-surface);
      --fc-today-bg-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
      --fc-button-bg-color: var(--color-surface);
      --fc-button-border-color: var(--color-border);
      --fc-button-hover-bg-color: var(--color-surface-hover);
      --fc-button-hover-border-color: var(--color-border);
      --fc-button-active-bg-color: var(--color-primary);
      --fc-button-active-border-color: var(--color-primary);
      --fc-button-text-color: var(--color-text);
      color: var(--color-text);
    }
    ::ng-deep .fc-toolbar-title { color: var(--color-text); font-size: 1.125rem !important; }
    ::ng-deep .fc-event { cursor: pointer; }

    :host.rounded ::ng-deep .fc-scrollgrid,
    :host.rounded ::ng-deep .fc-scrollgrid-section table {
      border-radius: 10px;
      overflow: hidden;
    }
    :host.rounded ::ng-deep .fc-event {
      border-radius: 6px !important;
    }
    :host.rounded ::ng-deep .fc-button {
      border-radius: 6px !important;
    }
  `],
})
export class CalendarComponent implements OnInit {
  private readonly service = inject(CalendarService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  private readonly calendarRef = viewChild(FullCalendarComponent);

  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly settings = signal<CalendarSettings | null>(null);
  protected readonly slotMenu = signal<SlotMenu>({
    visible: false,
    x: 0,
    y: 0,
    start: null,
    end: null,
    eventsAtSlot: [],
  });

  protected rounded(): boolean {
    return this.settings()?.borderStyle === 'ROUNDED';
  }

  protected containerHeight(): string {
    const size = this.settings()?.size ?? 'NORMAL';
    if (size === 'COMPACT') return '600px';
    if (size === 'COMFORTABLE') return '900px';
    return '760px';
  }

  protected calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    height: '100%',
    locale: 'es',
    firstDay: 1,
    selectable: true,
    editable: true,
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    select: (info) => this.onSelect(info),
    eventClick: (info) => this.onEventClick(info),
    eventDrop: (info) => this.onEventDrop(info),
    eventResize: (info) => this.onEventDrop(info as unknown as EventDropArg),
    events: [],
  };

  ngOnInit(): void {
    this.service.getSettings().subscribe({
      next: (s) => {
        this.settings.set(s);
        this.calendarOptions = {
          ...this.calendarOptions,
          firstDay: s.firstDay,
          initialView: s.defaultView,
        };
      },
      error: () => undefined,
    });
    this.loadEvents();
  }

  private loadEvents(): void {
    this.service.list().subscribe({
      next: (events) => {
        this.events.set(events);
        const mapped: EventInput[] = events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.startDate,
          end: e.endDate,
          allDay: e.allDay,
          backgroundColor: e.color,
          borderColor: e.color,
          extendedProps: { source: e },
        }));
        this.calendarOptions = { ...this.calendarOptions, events: mapped };
        const api = this.calendarRef()?.getApi();
        if (api) {
          api.removeAllEventSources();
          api.addEventSource(mapped);
        }
      },
      error: () => this.toastr.error('No se pudieron cargar los eventos'),
    });
  }

  protected openCreate(): void {
    this.openEventDialog({
      defaultStart: new Date(),
      defaultEnd: new Date(Date.now() + 60 * 60_000),
    });
  }

  protected openSettings(): void {
    const settings = this.settings();
    if (!settings) return;
    const ref = this.dialog.open<
      CalendarSettingsDialogComponent,
      CalendarSettingsDialogData,
      CalendarSettingsDialogResult
    >(CalendarSettingsDialogComponent, { data: { settings } });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.settings.set(updated);
        this.calendarOptions = {
          ...this.calendarOptions,
          firstDay: updated.firstDay,
          initialView: updated.defaultView,
        };
      }
    });
  }

  private onSelect(info: DateSelectArg): void {
    const eventsAtSlot = this.events().filter((e) => {
      const eStart = new Date(e.startDate).getTime();
      const eEnd = new Date(e.endDate).getTime();
      return eStart < info.end.getTime() && eEnd > info.start.getTime();
    });

    const rect = (info.jsEvent?.target as HTMLElement | null)?.getBoundingClientRect();
    const x = info.jsEvent ? info.jsEvent.clientX : rect ? rect.left : 100;
    const y = info.jsEvent ? info.jsEvent.clientY : rect ? rect.bottom : 100;

    this.slotMenu.set({
      visible: true,
      x: Math.min(x, window.innerWidth - 260),
      y: Math.min(y, window.innerHeight - 280),
      start: info.start,
      end: info.end,
      eventsAtSlot,
    });
  }

  protected createFromSlot(): void {
    const menu = this.slotMenu();
    if (!menu.start || !menu.end) return;
    this.closeSlotMenu();
    this.openEventDialog({ defaultStart: menu.start, defaultEnd: menu.end });
  }

  protected editEvent(event: CalendarEvent): void {
    this.closeSlotMenu();
    this.openEventDialog({ event });
  }

  protected closeSlotMenu(): void {
    this.slotMenu.update((m) => ({ ...m, visible: false }));
  }

  private onEventClick(info: EventClickArg): void {
    const source = info.event.extendedProps['source'] as CalendarEvent | undefined;
    if (source) this.openEventDialog({ event: source });
  }

  private onEventDrop(info: EventDropArg): void {
    const source = info.event.extendedProps['source'] as CalendarEvent | undefined;
    if (!source || !info.event.start) return;
    const start = info.event.start.toISOString();
    const end = (info.event.end ?? info.event.start).toISOString();
    this.service.update(source.id, { startDate: start, endDate: end }).subscribe({
      next: () => this.toastr.success('Evento movido'),
      error: () => {
        info.revert();
        this.toastr.error('No se pudo mover el evento');
      },
    });
  }

  private openEventDialog(data: EventDialogData): void {
    const ref = this.dialog.open<EventDialogComponent, EventDialogData, EventDialogResult>(
      EventDialogComponent,
      { data },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadEvents();
    });
  }
}
