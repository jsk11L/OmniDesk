import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';

import { environment } from '../../../../environments/environment';

interface TurnstileApi {
  render(
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'auto' | 'light' | 'dark';
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Cloudflare Turnstile widget. When no site key is configured (local dev,
 * CAPTCHA_PROVIDER=none) it renders nothing and never blocks the form.
 */
@Component({
  selector: 'app-captcha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #widget class="mt-1"></div>`,
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  readonly token = output<string | null>();

  @ViewChild('widget', { static: true }) widget!: ElementRef<HTMLDivElement>;

  protected readonly enabled = !!environment.captchaSiteKey;
  private widgetId?: string;

  get isEnabled(): boolean {
    return this.enabled;
  }

  ngAfterViewInit(): void {
    if (!this.enabled) return;
    this.loadScript()
      .then(() => this.render())
      .catch(() => this.token.emit(null));
  }

  ngOnDestroy(): void {
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch {
        /* ignore */
      }
    }
  }

  reset(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
      this.token.emit(null);
    }
  }

  private render(): void {
    if (!window.turnstile) return;
    this.widgetId = window.turnstile.render(this.widget.nativeElement, {
      sitekey: environment.captchaSiteKey,
      theme: 'auto',
      callback: (token) => this.token.emit(token),
      'expired-callback': () => this.token.emit(null),
      'error-callback': () => this.token.emit(null),
    });
  }

  private loadScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC.split('?')[0]}"]`);
    if (existing) {
      return new Promise((resolve) => existing.addEventListener('load', () => resolve(), { once: true }));
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Turnstile'));
      document.head.appendChild(script);
    });
  }
}
