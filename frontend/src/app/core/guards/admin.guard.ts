import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CV_ROL } from '../constants/cv-roles';
import { AuthService } from '../services/auth/auth.service';

/** Rutas `/admin/*`: solo rol Admin. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return router.createUrlTree(['/'], { queryParams: { authModal: 'login' } });
  }

  if (auth.hasRol(CV_ROL.admin)) {
    return true;
  }

  if (auth.hasRol(CV_ROL.publicador)) {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/']);
};
