import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
  computed,
  ElementRef,
  inject,
} from '@angular/core';

import { EMOJI_CATEGORIES, EmojiCategory } from './emoji-data';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="emoji-picker">
      <button
        type="button"
        class="trigger"
        [class.empty]="!value()"
        (click)="toggle()"
        [title]="value() ? 'Cambiar emoji' : 'Elegir emoji'"
      >
        @if (value()) {
          <span>{{ value() }}</span>
        } @else {
          <span class="placeholder">{{ placeholder }}</span>
        }
      </button>

      @if (open()) {
        <div class="popover" (click)="$event.stopPropagation()">
          <input
            type="text"
            [value]="query()"
            (input)="onSearch($event)"
            placeholder="Search…"
            class="search-input"
            autofocus
          />
          <div class="tabs">
            @for (cat of categories; track cat.key) {
              <button
                type="button"
                (click)="setActiveCategory(cat.key)"
                [class.active]="activeCategory() === cat.key && !query()"
                [title]="cat.label"
              >{{ cat.emojis[0] }}</button>
            }
          </div>
          <div class="emoji-grid">
            @for (e of visibleEmojis(); track e) {
              <button
                type="button"
                class="emoji-cell"
                (click)="pick(e)"
              >{{ e }}</button>
            } @empty {
              <p class="empty-state">No hay resultados</p>
            }
          </div>
          @if (value()) {
            <button type="button" class="clear" (click)="clear()">Quitar emoji</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .emoji-picker { position: relative; display: inline-block; }
    .trigger {
      width: 44px;
      height: 44px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-background);
      font-size: 1.5rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .trigger:hover { border-color: var(--color-primary); }
    .trigger.empty .placeholder {
      opacity: 0.35;
      font-size: 1.25rem;
    }
    .popover {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      z-index: 50;
      width: 320px;
      max-height: 360px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--color-background);
      border: none;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
      outline: none;
      font-size: 0.875rem;
    }
    .tabs {
      display: flex;
      gap: 2px;
      padding: 0.25rem;
      border-bottom: 1px solid var(--color-border);
      overflow-x: auto;
    }
    .tabs button {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      font-size: 1.125rem;
      opacity: 0.6;
      transition: opacity 0.15s, background 0.15s;
    }
    .tabs button:hover { opacity: 1; background: var(--color-surface-hover); }
    .tabs button.active { opacity: 1; background: var(--color-surface-hover); }
    .emoji-grid {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
    }
    .emoji-cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .emoji-cell:hover { background: var(--color-surface-hover); }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--color-text-muted);
      padding: 1rem;
      font-size: 0.875rem;
    }
    .clear {
      padding: 0.5rem;
      font-size: 0.75rem;
      color: var(--color-danger);
      border-top: 1px solid var(--color-border);
      cursor: pointer;
    }
    .clear:hover { background: var(--color-surface-hover); }
  `],
})
export class EmojiPickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() placeholder = '🙂';

  @Input() set initialValue(v: string | null) {
    this.value.set(v ?? null);
  }

  @Output() valueChange = new EventEmitter<string | null>();

  protected readonly categories: EmojiCategory[] = EMOJI_CATEGORIES;
  protected readonly value = signal<string | null>(null);
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeCategory = signal<string>(EMOJI_CATEGORIES[0].key);

  protected readonly visibleEmojis = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (q) {
      const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
      if (q.length === 0) return all;
      const matchedCategories = EMOJI_CATEGORIES.filter((c) =>
        c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q),
      );
      if (matchedCategories.length > 0) {
        return matchedCategories.flatMap((c) => c.emojis);
      }
      return all;
    }
    const cat = EMOJI_CATEGORIES.find((c) => c.key === this.activeCategory());
    return cat?.emojis ?? [];
  });

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.open.set(false);
  }

  protected toggle(): void {
    this.open.update((v) => !v);
    if (!this.open()) this.query.set('');
  }

  protected setActiveCategory(key: string): void {
    this.activeCategory.set(key);
    this.query.set('');
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected pick(emoji: string): void {
    this.value.set(emoji);
    this.valueChange.emit(emoji);
    this.open.set(false);
  }

  protected clear(): void {
    this.value.set(null);
    this.valueChange.emit(null);
    this.open.set(false);
  }
}
