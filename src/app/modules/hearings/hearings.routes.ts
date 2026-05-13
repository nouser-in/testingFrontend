import { Routes } from '@angular/router';

export const hearingsRoutes: Routes = [
  { path: '', loadComponent: () => import('./hearings-list.component').then(m => m.HearingsListComponent) },
  { path: ':id', loadComponent: () => import('./hearing-detail.component').then(m => m.HearingDetailComponent) },
];
