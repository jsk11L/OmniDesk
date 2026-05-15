import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FullCalendarModule } from '@fullcalendar/angular';
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
import type { CalendarEvent } from './calendar.types';

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FullCalendarModule],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Calendario</h1>
          <p class="text-sm text-text-muted">
            Click en un slot para crear un evento. Click en un evento para editarlo.
          </p>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          + Nuevo evento
        </button>
      </header>

      <div class="flex-1 p-4 overflow-auto">
        <full-calendar [options]="calendarOptions"></full-calendar>
      </div>
    </div>
  `,
  styles: [
    `
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
      ::ng-deep .fc-event {
        cursor: pointer;
      }
      ::ng-deep .fc-toolbar-title {
        color: var(--color-text);
      }
    `,
  ],
})
export class CalendarComponent implements OnInit {
  private readonly service = inject(CalendarService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  protected readonly events = signal<EventInput[]>([]);

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
    this.loadEvents();
  }

  private loadEvents(): void {
    this.service.list().subscribe({
      next: (events) => {
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
        this.events.set(mapped);
        this.calendarOptions = { ...this.calendarOptions, events: mapped };
      },
      error: () => this.toastr.error('No se pudieron cargar los eventos'),
    });
  }

  protected openCreate(): void {
    this.openDialog({ defaultStart: new Date(), defaultEnd: new Date(Date.now() + 60 * 60_000) });
  }

  private onSelect(info: DateSelectArg): void {
    this.openDialog({ defaultStart: info.start, defaultEnd: info.end });
  }

  private onEventClick(info: EventClickArg): void {
    const source = info.event.extendedProps['source'] as CalendarEvent | undefined;
    if (source) this.openDialog({ event: source });
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

  private openDialog(data: EventDialogData): void {
    const ref = this.dialog.open<EventDialogComponent, EventDialogData, EventDialogResult>(
      EventDialogComponent,
      { data, panelClass: 'app-dialog-panel' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadEvents();
    });
  }
}
