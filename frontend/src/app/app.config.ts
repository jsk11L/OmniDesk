import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { provideToastr } from 'ngx-toastr';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const DIALOG_DEFAULTS: MatDialogConfig = {
  // No fixed width: each dialog's own inner `w-[min(Npx,95vw)]` governs, so the
  // panel never squeezes content (which made text hit the edges). maxWidth keeps
  // it within the viewport on phones.
  maxWidth: '95vw',
  maxHeight: '90vh',
  panelClass: 'omni-dialog',
  backdropClass: 'omni-backdrop',
  autoFocus: 'first-tabbable',
  restoreFocus: true,
  hasBackdrop: true,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    provideCharts(withDefaultRegisterables()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
      fallbackLang: 'en',
    }),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: DIALOG_DEFAULTS },
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
  ],
};
