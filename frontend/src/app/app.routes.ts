import type { Routes } from '@angular/router';

import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then((m) => m.CalendarComponent),
      },
      {
        path: 'lists',
        loadChildren: () =>
          import('./features/lists/lists.routes').then((m) => m.LISTS_ROUTES),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/notes-home/notes-home.component').then(
            (m) => m.NotesHomeComponent,
          ),
      },
      {
        path: 'todos',
        loadComponent: () =>
          import('./features/todos/kanban-board/kanban-board.component').then(
            (m) => m.KanbanBoardComponent,
          ),
      },
      {
        path: 'habits',
        loadComponent: () =>
          import('./features/habits/habits-home/habits-home.component').then(
            (m) => m.HabitsHomeComponent,
          ),
      },
      {
        path: 'finance',
        loadComponent: () =>
          import('./features/finance/finance-dashboard/finance-dashboard.component').then(
            (m) => m.FinanceDashboardComponent,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/notifications/notification-list/notification-list.component'
          ).then((m) => m.NotificationListComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-home/settings-home.component').then(
            (m) => m.SettingsHomeComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
