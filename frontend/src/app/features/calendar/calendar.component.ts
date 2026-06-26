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
      <header class="px-4 sm:px-6 py-3 border-b border-border-soft flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="uppercase-tag">Calendar</div>
          <h1 class="text-xl sm:text-2xl font-semibold mt-0.5">Your schedule</h1>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" (click)="openCreate()" class="btn btn-sm btn-primary">
            + New event
          </button>
          <button
            type="button"
            (click)="openSettings()"
            class="btn btn-sm btn-icon"
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <div class="flex-1 p-3 sm:p-5 overflow-auto">
        <div class="cal-shell" [style.height]="containerHeight()">
          <full-calendar [options]="calendarOptions"></full-calendar>
        </div>
      </div>

      @if (slotMenu().visible) {
        <div
          class="slot-menu"
          [style.left.px]="slotMenu().x"
          [style.top.px]="slotMenu().y"
          (click)="$event.stopPropagation()"
        >
          <button type="button" (click)="createFromSlot()">+ Create event</button>
          @if (slotMenu().eventsAtSlot.length > 0) {
            <hr />
            <p class="menu-section">Events in this slot</p>
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

    /* Rounded card that holds the whole grid — softens the boxy default. */
    .cal-shell {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-surface);
    }

    ::ng-deep .fc {
      --fc-border-color: var(--color-border-soft);
      --fc-page-bg-color: transparent;
      --fc-neutral-bg-color: var(--color-surface);
      --fc-today-bg-color: color-mix(in srgb, var(--color-primary) 7%, transparent);
      --fc-button-bg-color: var(--color-surface);
      --fc-button-border-color: var(--color-border);
      --fc-button-hover-bg-color: var(--color-surface-hover);
      --fc-button-hover-border-color: var(--color-text-faint);
      --fc-button-active-bg-color: var(--color-surface-hover);
      --fc-button-active-border-color: var(--color-text-faint);
      --fc-button-text-color: var(--color-text-muted);
      color: var(--color-text);
    }

    /* Toolbar */
    ::ng-deep .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 12px; padding: 12px 14px 0; }
    ::ng-deep .fc-toolbar-title {
      color: var(--color-text);
      font-size: 1.0625rem !important;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    ::ng-deep .fc .fc-button {
      border-radius: var(--radius-sm) !important;
      font-size: 0.78rem;
      padding: 4px 10px;
      box-shadow: none !important;
      text-transform: capitalize;
      font-weight: 500;
    }
    ::ng-deep .fc .fc-button-primary:focus { box-shadow: none !important; }
    ::ng-deep .fc .fc-button-active {
      color: var(--color-primary) !important;
      background: var(--color-primary-ghost) !important;
      border-color: transparent !important;
    }

    /* Column (weekday) headers — mono, uppercase, faint */
    ::ng-deep .fc .fc-col-header-cell {
      background: var(--color-surface-2);
      padding: 9px 8px;
    }
    ::ng-deep .fc .fc-col-header-cell-cushion {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-faint);
      font-weight: 500;
      padding: 2px 4px;
    }

    /* Day cells — more breathing room, faint other-month */
    ::ng-deep .fc .fc-daygrid-day-frame { padding: 3px; min-height: 104px; }
    ::ng-deep .fc .fc-daygrid-day-number {
      font-size: 12px;
      color: var(--color-text-muted);
      padding: 4px 6px;
    }
    ::ng-deep .fc .fc-day-other .fc-daygrid-day-number { color: var(--color-text-faint); }
    ::ng-deep .fc .fc-day-other { background: rgba(0, 0, 0, 0.12); }

    /* Today: badge the number instead of flooding the cell */
    ::ng-deep .fc .fc-day-today .fc-daygrid-day-number {
      background: var(--color-primary);
      color: #fff;
      font-weight: 600;
      border-radius: 6px;
      min-width: 22px;
      text-align: center;
      margin: 2px;
      padding: 3px 6px;
    }

    /* Events */
    ::ng-deep .fc-event {
      cursor: pointer;
      border: none;
      font-size: 11px;
      box-shadow: none;
    }
    ::ng-deep .fc .fc-daygrid-event { margin-top: 2px; }
    ::ng-deep .fc .fc-daygrid-more-link {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--color-text-faint);
      padding-left: 6px;
    }
    ::ng-deep .fc .fc-event-time { font-family: var(--font-mono); font-size: 9px; opacity: 0.9; }

    /* List view rows */
    ::ng-deep .fc .fc-list { border-radius: var(--radius-lg); overflow: hidden; }
    ::ng-deep .fc .fc-list-event:hover td { background: var(--color-surface-hover); }
    ::ng-deep .fc .fc-list-day-cushion { background: var(--color-surface-2); }
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
    locale: 'en',
    firstDay: 1,
    selectable: true,
    editable: true,
    dayMaxEvents: 3,
    eventDisplay: 'block',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    select: (info) => this.onSelect(info),
    eventClick: (info) => this.onEventClick(info),
    eventDrop: (info) => this.onEventDrop(info),
    eventResize: (info) => this.onEventDrop(info as unknown as EventDropArg),
    eventDidMount: (arg) => this.styleEvent(arg.el, arg.event.backgroundColor, arg.view.type),
    events: [],
  };

  /**
   * Repaints each event as a soft pill: translucent fill + a solid colored
   * left bar (mirrors the design handoff). Skipped in list view, whose rows
   * read better with the default treatment.
   */
  private styleEvent(el: HTMLElement, color: string | undefined, viewType: string): void {
    if (viewType === 'listWeek' || !color) return;
    const isHex = /^#[0-9a-f]{6}$/i.test(color);
    el.style.backgroundColor = isHex ? `${color}22` : color;
    el.style.borderColor = 'transparent';
    el.style.borderLeft = `2px solid ${color}`;
    el.style.borderRadius = '4px';
    el.style.color = 'var(--color-text)';
    el.style.padding = '1px 4px';
  }

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
      error: () => this.toastr.error('Could not load events'),
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
      next: () => this.toastr.success('Event moved'),
      error: () => {
        info.revert();
        this.toastr.error('Could not move the event');
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
