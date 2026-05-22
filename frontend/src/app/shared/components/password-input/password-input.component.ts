import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

interface PasswordCheck {
  key: string;
  label: string;
  test: (v: string) => boolean;
}

const CHECKS: PasswordCheck[] = [
  { key: 'len', label: 'Al menos 8 caracteres', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { key: 'digit', label: 'Un número', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'Un carácter especial (!@#$%&*?)', test: (v) => /[!@#$%&*?]/.test(v) },
];

@Component({
  selector: 'app-password-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="password-input">
      <div class="input-wrap">
        <input
          [type]="visible() ? 'text' : 'password'"
          [value]="value()"
          (input)="onInput($event)"
          [placeholder]="placeholder"
          [attr.autocomplete]="autocomplete"
          class="w-full px-3 py-2 pr-10 bg-background border border-border rounded text-text placeholder:text-text-muted focus:border-primary outline-none"
        />
        <button
          type="button"
          (click)="toggleVisible()"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
          [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        >
          {{ visible() ? '👁' : '👁‍🗨' }}
        </button>
      </div>

      @if (showChecks && value()) {
        <ul class="mt-2 space-y-1">
          @for (check of checks; track check.key) {
            <li class="flex items-center gap-2 text-xs transition-colors"
                [class.text-success]="passes(check)"
                [class.text-text-muted]="!passes(check)">
              <span class="inline-block w-3.5 text-center">
                {{ passes(check) ? '✓' : '○' }}
              </span>
              <span>{{ check.label }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .input-wrap { position: relative; }
  `],
})
export class PasswordInputComponent {
  @Input() placeholder = '••••••••';
  @Input() autocomplete = 'new-password';
  @Input() showChecks = true;

  @Input() set initialValue(v: string) {
    this.value.set(v);
  }

  @Output() valueChange = new EventEmitter<string>();
  @Output() validChange = new EventEmitter<boolean>();

  protected readonly value = signal('');
  protected readonly visible = signal(false);
  protected readonly checks = CHECKS;

  protected readonly isValid = computed(() => CHECKS.every((c) => c.test(this.value())));

  protected passes(check: PasswordCheck): boolean {
    return check.test(this.value());
  }

  protected toggleVisible(): void {
    this.visible.update((v) => !v);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.valueChange.emit(next);
    this.validChange.emit(this.isValid());
  }
}
