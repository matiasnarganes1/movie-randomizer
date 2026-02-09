import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  try {
    const ok = await auth.isLoggedIn();
    if (ok) return true;
  } catch {}
  router.navigateByUrl('/login');
  return false;
};