import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
      if (authService.hasRole(allowedRoles)) {
        return true;
      }
      
      // Si está logueado pero no tiene el rol, redirigir según su rol correspondiente
      const role = authService.currentUser()?.role;
      if (role === 'operator') {
        router.navigate(['/operator']);
      } else {
        router.navigate(['/dashboard']);
      }
      return false;
    }

    // Si no está logueado, ir al login
    router.navigate(['/login']);
    return false;
  };
};
