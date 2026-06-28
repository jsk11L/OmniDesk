import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { CalendarService } from '../services/calendar.service';
import type {
  CalendarBorderStyle,
  CalendarSettings,
  CalendarSize,
  UpdateCalendarSettingsDto,
} from '../calendar.types';

export interface CalendarSettingsDialogData {
  settings: CalendarSettings;
}

export type CalendarSettingsDialogResult = CalendarSettings | undefined;

@Component({
  selector: 'app-calendar-settings-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="bg-surface text-text p-6 w-[min(440px,95vw)]">
      <h2 class="text-lg font-semibold mb-4">Calendar settings</h2>

      <form [formGroup]="form" class="space-y-4">
        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Size</span>
          <select formControlName="size" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
            <option value="COMPACT">Compact</option>
            <option value="NORMAL">Normal</option>
            <option value="COMFORTABLE">Comfortable</option>
          </select>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Border style</span>
          <select formControlName="borderStyle" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
            <option value="ROUNDED">Rounded</option>
            <option value="SQUARE">Square</option>
          </select>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">First day of the week</span>
          <select formControlName="firstDay" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
            <option [ngValue]="1">Monday</option>
            <option [ngValue]="0">Sunday</option>
          </select>
        </label>

        <label class="block">
          <span class="block text-xs text-text-muted mb-1">Default view</span>
          <select formControlName="defaultView" class="w-full px-3 py-2 bg-background border border-border rounded outline-none focus:border-primary">
            <option value="dayGridMonth">Month</option>
            <option value="timeGridWeek">Week</option>
            <option value="timeGridDay">Day</option>
            <option value="listWeek">Agenda</option>
          </select>
        </label>
      </form>

      <hr class="my-4 border-border" />

      <div>
        <button
          type="button"
          (click)="exportIcs()"
          [disabled]="exporting()"
          class="w-full py-2 rounded border border-border hover:bg-surface-hover text-sm"
        >
          {{ exporting() ? 'Exporting…' : 'Export to .ics (Google Calendar, Outlook…)' }}
        </button>
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <button type="button" (click)="ref.close()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">
          Cancel
        </button>
        <button
          type="button"
          (click)="save()"
          [disabled]="saving()"
          class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
        >
          {{ saving() ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  `,
})
export class CalendarSettingsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CalendarService);
  private readonly toastr = inject(ToastrService);

  protected readonly saving = signal(false);
  protected readonly exporting = signal(false);

  protected readonly form;

  constructor(
    public ref: MatDialogRef<CalendarSettingsDialogComponent, CalendarSettingsDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: CalendarSettingsDialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      size: [data.settings.size as CalendarSize],
      borderStyle: [data.settings.borderStyle as CalendarBorderStyle],
      firstDay: [data.settings.firstDay],
      defaultView: [data.settings.defaultView],
    });
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const dto = this.form.getRawValue() as UpdateCalendarSettingsDto;
    this.service.updateSettings(dto).subscribe({
      next: (settings) => {
        this.toastr.success('Settings saved');
        this.ref.close(settings);
      },
      error: () => {
        this.saving.set(false);
        this.toastr.error('Could not save');
      },
    });
  }

  exportIcs(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.service.exportIcs().subscribe({
      next: (res) => {
        this.exporting.set(false);
        const blob = res.body as Blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'omnidesk-calendar.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toastr.success('File downloaded');
      },
      error: () => {
        this.exporting.set(false);
        this.toastr.error('Could not export');
      },
    });
  }
}
