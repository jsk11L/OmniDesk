import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { ImportReport, NotesService } from '../services/notes.service';

@Component({
  selector: 'app-obsidian-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="h-full overflow-auto">
      <div class="max-w-xl mx-auto px-6 py-8">
        <a routerLink="/app/notes" class="text-xs text-text-muted hover:text-text">← Notes</a>
        <h1 class="text-2xl font-semibold mt-3 mb-1">Import from Obsidian</h1>
        <p class="text-sm text-text-muted mb-6">
          Upload your vault as a <strong>.zip</strong>. Markdown files become notes,
          folders become tags, <code>[[wikilinks]]</code> are resolved between notes,
          and embedded images are uploaded. Max 200 MB — split larger vaults.
        </p>

        @if (!report()) {
          <div
            class="border-2 border-dashed border-border rounded-lg p-8 text-center"
            [class.border-primary]="dragging()"
            (dragover)="$event.preventDefault(); dragging.set(true)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
          >
            @if (busy()) {
              <p class="text-text-muted">Importing… this can take a moment for large vaults.</p>
            } @else {
              <p class="mb-3">Drag your vault .zip here, or</p>
              <label class="inline-block px-4 py-2 rounded bg-primary text-white text-sm cursor-pointer hover:opacity-90">
                Choose file
                <input type="file" accept=".zip,application/zip" hidden (change)="onPick($event)" />
              </label>
            }
          </div>
          @if (error()) { <p class="text-sm text-danger mt-3">{{ error() }}</p> }
        } @else {
          <div class="bg-surface border border-border rounded-lg p-5">
            <p class="text-success font-medium mb-3">✓ Import complete</p>
            <ul class="text-sm space-y-1">
              <li>{{ report()!.notesCreated }} notes created</li>
              <li>{{ report()!.assetsUploaded }} images uploaded</li>
              <li>{{ report()!.wikilinksResolved }} wikilinks resolved</li>
              <li>{{ report()!.wikilinksUnresolved }} wikilinks left as text</li>
              @if (report()!.duplicateTitlesRenamed) {
                <li>{{ report()!.duplicateTitlesRenamed }} duplicate titles renamed</li>
              }
              @if (report()!.skipped.length) {
                <li class="text-text-muted">{{ report()!.skipped.length }} files skipped</li>
              }
              @if (report()!.errors.length) {
                <li class="text-danger">{{ report()!.errors.length }} errors</li>
              }
            </ul>
            <div class="flex gap-2 mt-4">
              <a routerLink="/app/notes" class="px-4 py-2 text-sm rounded bg-primary text-white hover:opacity-90">Go to Notes</a>
              <button type="button" (click)="reset()" class="px-4 py-2 text-sm rounded hover:bg-surface-hover">Import another</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ObsidianImportComponent {
  private readonly notes = inject(NotesService);
  private readonly toastr = inject(ToastrService);

  protected readonly busy = signal(false);
  protected readonly dragging = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly report = signal<ImportReport | null>(null);

  protected onPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.upload(file);
  }

  protected reset(): void {
    this.report.set(null);
    this.error.set(null);
  }

  private upload(file: File): void {
    if (!/\.zip$/i.test(file.name)) {
      this.error.set('Please choose a .zip file');
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    this.notes.importObsidian(file).subscribe({
      next: (report) => {
        this.busy.set(false);
        this.report.set(report);
        this.toastr.success(`Imported ${report.notesCreated} notes`);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        const body = err.error as { error?: { message?: string } } | null;
        this.error.set(body?.error?.message ?? 'Import failed');
      },
    });
  }
}
