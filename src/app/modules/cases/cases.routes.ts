import { Routes } from '@angular/router';

export const casesRoutes: Routes = [
  { path: '', loadComponent: () => import('./cases-list.component').then(m => m.CasesListComponent) },
  { path: 'new', loadComponent: () => import('./case-form.component').then(m => m.CaseFormComponent) },
  { path: ':id', loadComponent: () => import('./case-detail.component').then(m => m.CaseDetailComponent) },
];
