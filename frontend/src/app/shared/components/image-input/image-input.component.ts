import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { UploadsService } from '../../services/uploads.service';

type Mode = 'url' | 'upload';

@Component({
  selector: 'app-image-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="image-input">
      <div class="mode-tabs">
        <button
          type="button"
          (click)="setMode('upload')"
          [class.active]="mode() === 'upload'"
        >Upload file</button>
        <button
          type="button"
          (click)="setMode('url')"
          [class.active]="mode() === 'url'"
        >URL</button>
      </div>

      @if (mode() === 'url') {
        <input
          type="url"
          [value]="value() ?? ''"
          (input)="onUrlChange($event)"
          placeholder="https://…"
          class="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none mt-2"
        />
      } @else {
        <div
          class="dropzone mt-2"
          (click)="fileInput.click()"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop($event)"
          [class.uploading]="uploading()"
        >
          @if (uploading()) {
            <span>Uploading…</span>
          } @else {
            <span>Click or drag an image here</span>
            <span class="hint">JPG, PNG, WEBP or GIF · max 5MB</span>
          }
        </div>
        <input
          #fileInput
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          (change)="onFileSelected($event)"
          hidden
        />
      }

      @if (resolvedPreview()) {
        <div class="preview-wrap">
          <img [src]="resolvedPreview()!" alt="" class="preview" />
          <button type="button" (click)="clear()" class="clear-btn">Remove image</button>
        </div>
      }

      @if (error()) {
        <p class="text-sm text-danger mt-2">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mode-tabs {
      display: flex;
      gap: 0.25rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 2px;
      width: fit-content;
    }
    .mode-tabs button {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }
    .mode-tabs button.active {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }
    .dropzone {
      border: 1.5px dashed var(--color-border);
      border-radius: 8px;
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
    .dropzone:hover { border-color: var(--color-primary); background: var(--color-surface-hover); }
    .dropzone.uploading { opacity: 0.6; pointer-events: none; }
    .dropzone .hint { font-size: 0.75rem; opacity: 0.7; }
    .preview-wrap { margin-top: 0.75rem; }
    .preview {
      width: 100%;
      max-height: 200px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid var(--color-border);
    }
    .clear-btn {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--color-danger);
    }
    .clear-btn:hover { text-decoration: underline; }
  `],
})
export class ImageInputComponent {
  private readonly uploads = inject(UploadsService);
  private readonly toastr = inject(ToastrService);

  @Input() set initialValue(v: string | null) {
    this.value.set(v ?? null);
    // Default to URL mode: pasting/typing a link is the common case and works
    // natively. Only open in upload mode when the stored value is a relative
    // uploaded asset (e.g. "/uploads/..."), not an absolute http(s) URL.
    this.mode.set(v && !/^https?:\/\//i.test(v) ? 'upload' : 'url');
  }

  @Output() valueChange = new EventEmitter<string | null>();
  @Output() thumbChange = new EventEmitter<string | null>();

  protected readonly value = signal<string | null>(null);
  protected readonly mode = signal<Mode>('upload');
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resolvedPreview = computed(() => this.uploads.resolveUrl(this.value()));

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  protected onUrlChange(event: Event): void {
    const url = (event.target as HTMLInputElement).value.trim() || null;
    this.value.set(url);
    this.valueChange.emit(url);
    this.thumbChange.emit(url);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  protected clear(): void {
    this.value.set(null);
    this.valueChange.emit(null);
    this.thumbChange.emit(null);
  }

  private uploadFile(file: File): void {
    this.error.set(null);
    this.uploading.set(true);
    this.uploads.upload(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.value.set(result.url);
        this.valueChange.emit(result.url);
        this.thumbChange.emit(result.thumbUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        const text = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Upload failed';
        this.error.set(text);
        this.toastr.error(text);
      },
    });
  }
}
