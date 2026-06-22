import { Routes } from '@angular/router';
import { PublicLayout } from './layout/public-layout/public-layout';
import { AppLayout } from './layout/app-layout/app-layout';
import { CanvasLayout } from './layout/canvas-layout/canvas-layout';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Actions } from './core/constants/actions';

export const routes: Routes = [
  // ---- public marketing site ----
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home').then((m) => m.HomePage) },
    ],
  },

  // ---- auth ----
  {
    path: 'auth',
    component: PublicLayout,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage) },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },

  // ---- authenticated app (gated per plan via permissionGuard) ----
  {
    path: 'app',
    component: AppLayout,
    // canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'templates', loadComponent: () => import('./features/templates/templates').then((m) => m.TemplatesPage), canActivate: [permissionGuard], data: { action: Actions.Template_View } },
      { path: 'credentials', loadComponent: () => import('./features/credentials/credentials').then((m) => m.CredentialsPage), canActivate: [permissionGuard], data: { action: Actions.Credential_View } },
      { path: 'approvals', loadComponent: () => import('./features/approvals/approvals').then((m) => m.ApprovalsPage), canActivate: [permissionGuard], data: { action: Actions.Credential_Approve } },
      { path: 'branding', loadComponent: () => import('./features/branding/branding').then((m) => m.BrandingPage), canActivate: [permissionGuard], data: { action: Actions.Branding_Manage } },
      { path: 'users', loadComponent: () => import('./features/users/users').then((m) => m.UsersPage), canActivate: [permissionGuard], data: { action: Actions.User_View } },
      { path: 'roles', loadComponent: () => import('./features/roles/roles').then((m) => m.RolesPage), canActivate: [permissionGuard], data: { action: Actions.Role_Manage } },
      { path: 'automation', loadComponent: () => import('./features/automation/automation').then((m) => m.AutomationPage), canActivate: [permissionGuard], data: { action: Actions.Automation_View } },
      { path: 'settings', loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage), canActivate: [permissionGuard], data: { action: Actions.Settings_Manage } },
      { path: 'support', loadComponent: () => import('./features/support/support').then((m) => m.SupportPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // ---- full-bleed canvas designer ----
  {
    path: 'canvas',
    component: CanvasLayout,
    // canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/designer/designer.component').then((m) => m.DesignerComponent), canActivate: [permissionGuard], data: { action: Actions.Template_Edit } },
      { path: ':id', loadComponent: () => import('./features/designer/designer.component').then((m) => m.DesignerComponent), canActivate: [permissionGuard], data: { action: Actions.Template_Edit } },
    ],
  },

  // ---- bulk certificate generation ----
  {
    path: 'bulk',
    component: CanvasLayout,
    // canActivate: [authGuard],
    children: [
      { path: ':id', loadComponent: () => import('./features/bulk/bulk.component').then((m) => m.BulkComponent), canActivate: [permissionGuard], data: { action: Actions.Credential_Bulk } },
    ],
  },

  { path: '**', redirectTo: '' },
];
