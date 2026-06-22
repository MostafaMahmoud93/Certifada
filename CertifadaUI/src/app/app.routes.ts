import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { EmptyLayout } from './layouts/empty-layout/empty-layout';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { CanvasLayout } from './layouts/canvas-layout/canvas-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'canvas',
    component: CanvasLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../app/pages/canvas-board/canvas-module').then(
            (m) => m.CanvasModule
          ),
      },
    ],
  },
  {
    path: 'designer',
    component: CanvasLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../app/features/designer/designer.component').then(
            (m) => m.DesignerComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../app/features/designer/designer.component').then(
            (m) => m.DesignerComponent
          ),
      },
    ],
  },
  {
    path: '',
    component: EmptyLayout,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../app/pages/home/home').then((m) => m.home),
      },
    ],
  },
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: 'land',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../app/pages/landing-page/land-module').then(
            (m) => m.LandModule
          ),
      },
      {
        path: '401-un-auth',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../app/pages/unauth/unauth').then(
            (m) => m.Unauth
          ),
      },
      {
        path: 'bulk/:id',
        loadComponent: () =>
          import('../app/features/bulk/bulk.component').then(
            (m) => m.BulkComponent
          ),
      },
    ],
  },
  //   {
  //   path: 'home',
  //   loadComponent: () => import('../app/pages/home/home').then(m => m.Home)
  // },
  {
    path: 'auth',
    component: EmptyLayout,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('../app/features/auth/login').then((m) => m.Login),
      },
      //TODO - add register page
    ],
  },
  {
    path: 'billing/success',
    loadComponent: () =>
      import('../app/billing/billing-success.component').then(
        (m) => m.BillingSuccessComponent
      ),
  },
  {
    path: 'billing/cancelled',
    loadComponent: () =>
      import('../app/billing/billing-cancelled.component').then(
        (m) => m.BillingCancelledComponent
      ),
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'support',
        loadComponent: () =>
          import('../app/support/support-center.component').then(
            (m) => m.SupportCenter
          ),
      },
    ],
  },
];
