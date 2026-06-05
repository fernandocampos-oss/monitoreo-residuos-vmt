import { Routes } from '@angular/router';
import { MapPublicComponent } from './pages/map-public/map-public.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OperatorComponent } from './pages/operator/operator.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: MapPublicComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [roleGuard(['admin_system', 'admin_municipal'])] 
  },
  { 
    path: 'operator', 
    component: OperatorComponent, 
    canActivate: [roleGuard(['operator'])] 
  },
  { 
    path: 'admin/users', 
    component: AdminUsersComponent, 
    canActivate: [roleGuard(['admin_system'])] 
  },
  { path: '**', redirectTo: '' }
];
