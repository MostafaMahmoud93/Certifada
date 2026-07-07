import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
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
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage) },
      { path: 'forgot', loadComponent: () => import('./features/auth/forgot/forgot').then((m) => m.ForgotPage) },
      { path: 'reset', loadComponent: () => import('./features/auth/reset/reset').then((m) => m.ResetPage) },
      { path: 'magic', loadComponent: () => import('./features/auth/magic/magic').then((m) => m.MagicPage) },
      { path: 'confirm', loadComponent: () => import('./features/auth/confirm/confirm').then((m) => m.ConfirmPage) },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },

  // ---- authenticated app (gated per plan via permissionGuard) ----
  {
    path: 'app',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'templates', loadComponent: () => import('./features/templates/templates').then((m) => m.TemplatesPage), canActivate: [permissionGuard], data: { action: Actions.Template_View } },
      { path: 'templates/:id/issue', loadComponent: () => import('./features/issue/issue.component').then((m) => m.IssueComponent), canActivate: [permissionGuard], data: { action: Actions.Credential_Generate } },
      { path: 'templates/:id/issued', loadComponent: () => import('./features/issued/issued.component').then((m) => m.IssuedComponent), canActivate: [permissionGuard], data: { action: Actions.Credential_View } },
      { path: 'credentials', loadComponent: () => import('./features/credentials/credentials').then((m) => m.CredentialsPage), canActivate: [permissionGuard], data: { action: Actions.Credential_View } },
      { path: 'approvals', loadComponent: () => import('./features/approvals/approvals').then((m) => m.ApprovalsPage), canActivate: [permissionGuard], data: { action: Actions.Credential_Approve } },
      { path: 'branding', loadComponent: () => import('./features/branding/branding').then((m) => m.BrandingPage), canActivate: [permissionGuard], data: { action: Actions.Branding_Manage } },
      { path: 'users', loadComponent: () => import('./features/users/users').then((m) => m.UsersPage), canActivate: [permissionGuard], data: { action: Actions.User_View } },
      { path: 'roles', loadComponent: () => import('./features/roles/roles').then((m) => m.RolesPage), canActivate: [permissionGuard], data: { action: Actions.Role_Manage } },
      { path: 'automation', loadComponent: () => import('./features/automation/automation').then((m) => m.AutomationPage), canActivate: [permissionGuard], data: { action: Actions.Automation_View } },
      { path: 'settings', loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage), canActivate: [permissionGuard], data: { action: Actions.Settings_Manage } },
      { path: 'support', loadComponent: () => import('./features/support/support').then((m) => m.SupportPage) },
      { path: 'messages', loadComponent: () => import('./features/messages/messages').then((m) => m.MessagesPage) },
      { path: 'forbidden', loadComponent: () => import('./features/errors/error.pages').then((m) => m.ForbiddenPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // ---- full-bleed canvas designer ----
  {
    path: 'canvas',
    component: CanvasLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/designer/designer.component').then((m) => m.DesignerComponent), canActivate: [permissionGuard], data: { action: Actions.Template_Edit } },
      { path: ':id', loadComponent: () => import('./features/designer/designer.component').then((m) => m.DesignerComponent), canActivate: [permissionGuard], data: { action: Actions.Template_Edit } },
    ],
  },

  // ---- bulk is folded into the per-template Issue page (legacy /bulk/:id redirects there) ----
  {
    path: 'bulk',
    children: [
      {
        path: ':id',
        canActivate: [(route: any) => inject(Router).createUrlTree(['/app/templates', route.paramMap.get('id'), 'issue'])],
        loadComponent: () => import('./features/bulk/bulk.component').then((m) => m.BulkComponent),
      },
    ],
  },

  // ---- public credential verification ----
  { path: 'verify/:id', loadComponent: () => import('./features/verify/verify.component').then((m) => m.VerifyComponent) },

  // ---- public recipient wallet (passwordless, email-owned) ----
  { path: 'wallet', loadComponent: () => import('./features/wallet/wallet').then((m) => m.WalletPage) },

  // ---- public pricing ----
  { path: 'pricing', loadComponent: () => import('./features/pricing/pricing').then((m) => m.PricingPage) },

  // ---- Stripe Checkout return pages ----
  { path: 'billing/success', loadComponent: () => import('./features/public/billing-result/billing-result').then((m) => m.BillingResultPage), data: { ok: true } },
  { path: 'billing/cancelled', loadComponent: () => import('./features/public/billing-result/billing-result').then((m) => m.BillingResultPage), data: { ok: false } },

  // ---- error pages ----
  { path: '403', loadComponent: () => import('./features/errors/error.pages').then((m) => m.ForbiddenPage) },
  { path: '404', loadComponent: () => import('./features/errors/error.pages').then((m) => m.NotFoundPage) },
  { path: '**', loadComponent: () => import('./features/errors/error.pages').then((m) => m.NotFoundPage) },
];
