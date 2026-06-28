import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface AppLanguage {
  code: string;
  label: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private static readonly STORAGE_KEY = 'omnidesk:lang';
  private readonly translate = inject(TranslateService);

  readonly available: AppLanguage[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  readonly current = signal<string>('en');

  /** Pick the saved language, else the browser's, else English. Call once at startup. */
  init(): void {
    const saved = localStorage.getItem(LanguageService.STORAGE_KEY);
    const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
    const supported = (c: string): boolean => this.available.some((l) => l.code === c);
    const lang = saved && supported(saved) ? saved : supported(browser) ? browser : 'en';
    this.set(lang);
  }

  set(code: string): void {
    if (!this.available.some((l) => l.code === code)) return;
    this.translate.use(code);
    this.current.set(code);
    localStorage.setItem(LanguageService.STORAGE_KEY, code);
    document.documentElement.lang = code;
  }
}
