import { Routes } from '@angular/router';

export const judgmentsRoutes: Routes = [
  { path: '', loadComponent: () => import('./judgments-list.component').then(m => m.JudgmentsListComponent) },
  { path: 'new', loadComponent: () => import('./judgment-form.component').then(m => m.JudgmentFormComponent) },
  { path: 'orders/new', loadComponent: () => import('./order-form.component').then(m => m.OrderFormComponent) },
  { path: 'orders', loadComponent: () => import('./orders-list.component').then(m => m.OrdersListComponent) },
];
