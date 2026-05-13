import { Routes } from '@angular/router';

export const complianceRoutes: Routes = [
  { path: '', loadComponent: () => import('./compliance.component').then(m => m.ComplianceComponent) },
];
