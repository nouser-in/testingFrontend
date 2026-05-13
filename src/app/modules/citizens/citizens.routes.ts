import { Routes } from '@angular/router';
import { notCitizenGuard } from '../../core/guards/auth.guard';

export const citizensRoutes: Routes = [
  // my-profile is accessible to CITIZEN role
  {
    path: 'my-profile',
    loadComponent: () => import('./my-profile.component').then(m => m.MyProfileComponent)
  },
  // Citizens list is only for ADMIN/CLERK
  {
    path: '',
    canActivate: [notCitizenGuard],
    loadComponent: () => import('./citizens-list.component').then(m => m.CitizensListComponent)
  },
  {
    path: 'new',
    canActivate: [notCitizenGuard],
    loadComponent: () => import('./citizen-form.component').then(m => m.CitizenFormComponent)
  },
  {
    path: ':id',
    canActivate: [notCitizenGuard],
    loadComponent: () => import('./citizen-detail.component').then(m => m.CitizenDetailComponent)
  },
];
