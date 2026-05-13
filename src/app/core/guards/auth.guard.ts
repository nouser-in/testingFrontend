import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};

/** Restrict pages that citizens cannot access */
export const notCitizenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/auth/login']); return false; }
  if (auth.hasRole('CITIZEN')) { router.navigate(['/dashboard']); return false; }
  return true;
};

/** Only admin can access */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/auth/login']); return false; }
  if (!auth.hasRole('ADMIN')) { router.navigate(['/dashboard']); return false; }
  return true;
};
