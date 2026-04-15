import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CV_ROL } from '../constants/cv-roles';
import { AuthService } from '../services/auth/auth.service';

/** Área del CV (dashboard, mi-cv, …): solo usuarios con rol Publicador. */
export const publicadorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return router.createUrlTree(['/'], { queryParams: { authModal: 'login' } });
  }

  if (auth.hasRol(CV_ROL.publicador)) {
    return true;
  }

  if (auth.hasRol(CV_ROL.admin)) {
    return router.createUrlTree(['/admin/usuarios']);
  }

  return router.createUrlTree(['/']);
};
