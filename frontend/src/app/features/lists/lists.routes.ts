import type { Routes } from '@angular/router';

export const LISTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./list-home/list-home.component').then((m) => m.ListHomeComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./list-detail/list-detail.component').then((m) => m.ListDetailComponent),
  },
];
