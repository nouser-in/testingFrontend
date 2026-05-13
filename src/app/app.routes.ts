import { Routes } from '@angular/router';
import { authGuard, guestGuard, notCitizenGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        // Admin only
        path: 'users',
        canActivate: [adminGuard],
        loadChildren: () => import('./modules/users/users.routes').then(m => m.usersRoutes)
      },
      {
        // CITIZEN cannot access citizens list (only admin/clerk)
        // But citizen can see their own profile at /citizens/my-profile
        path: 'citizens',
        loadChildren: () => import('./modules/citizens/citizens.routes').then(m => m.citizensRoutes)
      },
      {
        // ALL roles can access cases (citizen sees own cases, lawyer sees assigned cases)
        path: 'cases',
        loadChildren: () => import('./modules/cases/cases.routes').then(m => m.casesRoutes)
      },
      {
        path: 'hearings',
        loadChildren: () => import('./modules/hearings/hearings.routes').then(m => m.hearingsRoutes)
      },
      {
        // CITIZEN cannot access judgments directly
        path: 'judgments',
        canActivate: [notCitizenGuard],
        loadChildren: () => import('./modules/judgments/judgments.routes').then(m => m.judgmentsRoutes)
      },
      {
        // Only compliance roles + admin
        path: 'compliance',
        canActivate: [notCitizenGuard],
        loadChildren: () => import('./modules/compliance/compliance.routes').then(m => m.complianceRoutes)
      },
      {
        // Only compliance/auditor/admin
        path: 'reports',
        canActivate: [notCitizenGuard],
        loadChildren: () => import('./modules/reports/reports.routes').then(m => m.reportsRoutes)
      },
      {
        // ALL roles can see their own notifications
        path: 'notifications',
        loadComponent: () => import('./modules/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        // Admin and Auditor only - view system audit logs
        path: 'audit-logs',
        canActivate: [adminGuard],
        loadComponent: () => import('./modules/dashboard/audit-logs.component').then(m => m.AuditLogsComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
