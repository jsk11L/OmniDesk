import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RouletteEntry {
  id: string;
  title: string;
  image: string | null;
}

export interface RouletteDialogData {
  entries: RouletteEntry[];
}

/** Returns the picked entry id (to open it), or undefined if dismissed. */
export type RouletteDialogResult = string | undefined;

@Component({
  selector: 'app-roulette-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule],
  template: `
    <div class="bg-surface text-text w-[min(420px,95vw)] p-6 text-center">
      <div class="uppercase-tag mb-3">{{ spinning() ? 'Spinning…' : 'Your pick' }}</div>

      <div class="roulette-card" [class.is-spinning]="spinning()">
        @if (current()?.image; as img) {
          <img [src]="img" alt="" class="roulette-img" />
        } @else {
          <div class="roulette-ph">🎲</div>
        }
        <div class="roulette-title">{{ current()?.title ?? '—' }}</div>
      </div>

      <div class="flex justify-center gap-2 mt-5">
        @if (spinning()) {
          <button type="button" disabled class="px-4 py-2 rounded bg-primary/60 text-white text-sm">Spinning…</button>
        } @else {
          <button type="button" (click)="ref.close(current()?.id)"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">Open</button>
          <button type="button" (click)="spin()"
            class="px-4 py-2 rounded border border-border text-sm hover:bg-surface-hover">Spin again</button>
          <button type="button" (click)="ref.close()"
            class="px-4 py-2 rounded text-sm hover:bg-surface-hover">Close</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .roulette-card {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      padding: 18px;
      background: var(--color-surface-2);
      transition: border-color 120ms;
    }
    .roulette-card.is-spinning { border-color: var(--color-primary); }
    .roulette-img {
      width: 140px; height: 140px; object-fit: cover; border-radius: 10px;
      margin: 0 auto 12px; display: block;
    }
    .roulette-ph {
      width: 140px; height: 140px; border-radius: 10px; margin: 0 auto 12px;
      display: grid; place-items: center; font-size: 48px;
      background: var(--color-surface);
    }
    .roulette-title { font-size: 16px; font-weight: 600; line-height: 1.3; min-height: 1.3em; }
  `],
})
export class RouletteDialogComponent implements OnInit, OnDestroy {
  protected readonly spinning = signal(false);
  protected readonly current = signal<RouletteEntry | null>(null);
  private destroyed = false;

  constructor(
    public ref: MatDialogRef<RouletteDialogComponent, RouletteDialogResult>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RouletteDialogData,
  ) {}

  ngOnInit(): void {
    this.spin();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  protected spin(): void {
    const entries = this.data.entries;
    if (entries.length === 0) return;
    if (entries.length === 1) {
      this.current.set(entries[0]);
      return;
    }
    this.spinning.set(true);
    const winner = Math.floor(Math.random() * entries.length);
    const total = 22 + Math.floor(Math.random() * 6);
    let step = 0;

    const tick = (): void => {
      if (this.destroyed) return;
      if (step >= total) {
        this.current.set(entries[winner]);
        this.spinning.set(false);
        return;
      }
      // Random face during the spin (avoid repeating the same twice in a row).
      let idx = Math.floor(Math.random() * entries.length);
      if (entries[idx] === this.current()) idx = (idx + 1) % entries.length;
      this.current.set(entries[idx]);
      step++;
      // Ease-out: fast at first, slows toward the end.
      const delay = 45 + Math.pow(step / total, 2.6) * 320;
      setTimeout(tick, delay);
    };
    tick();
  }
}
