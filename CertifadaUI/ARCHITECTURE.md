# CertifadaUI — target structure

Goal: a conventional Angular layout — `core/` (app-wide singletons), `shared/` (reusable building blocks), `layouts/` (shells), and `features/` (one folder per feature area). Standalone components throughout.

## Target tree

```
src/app/
├─ core/                       # provided once, app-wide
│  ├─ guards/                  # auth.guard, permission.guard
│  ├─ interceptors/            # auth.interceptor, AuthUtils
│  ├─ services/                # auth, language, ai-helper, filter-config, template, certificate, brand-extractor
│  ├─ models/                  # models.ts, service-response, user, automation.model, filter.model
│  └─ render.util.ts
│
├─ shared/                     # reusable, imported by features
│  ├─ components/              # toast, dialog, signature, upgrade-plan, global-filter, floating-widget, loading
│  ├─ directives/              # has-action
│  ├─ pipes/                   # filter-by-search
│  ├─ enums/  constants/
│  └─ shared.module.ts
│
├─ layouts/                    # main, empty, dashboard, canvas + shell (header/footer/navbar/sidebar)
│
├─ features/
│  ├─ auth/                    # login  (← pages/Security/login)
│  ├─ dashboard/               # (← pages/dashboard)
│  ├─ designer/                # ✅ done — the new Fabric editor (replaces canvas-board)
│  ├─ certificates/            # templates, credentials, template-preview  (← pages/certificate/*)
│  ├─ reports/                 # report-table, column-configurator, agReport  (← pages/reports + pages/agReport)
│  ├─ branding/                # (← pages/branding)
│  ├─ email-templates/         # (← pages/email-templates)
│  ├─ security/                # roles, users, automation  (← pages/Security/*)
│  ├─ billing/                 # (← /billing)
│  ├─ support/                 # (← /support)
│  ├─ landing/                 # land shell page + home marketing  (← pages/landing-page + pages/home)
│  └─ unauth/                  # (← pages/unauth)
│
├─ app.config.ts  app.routes.ts  app.ts  app.html
└─ styles.scss                 # global design tokens (--cf-*)
```

## Migration order (one feature at a time, rebuild after each)

1. **core/** — move `pages/Security/Auth.service.ts` → `core/services/auth.service.ts`; move singleton services from `shared/` (language, ai-helper, filter-config) and `pages/landing-page/brand-extractor.service.ts` → `core/services/`; merge `models/` (ServiceResponse, User) into `core/models/`.
2. **features/auth** ← `pages/Security/login`.
3. **features/dashboard** ← `pages/dashboard`.
4. **features/certificates** ← `pages/certificate/*`.
5. **features/reports** ← `pages/reports` + `pages/agReport`.
6. **features/branding**, **features/email-templates**, **features/unauth**.
7. **features/security** ← `pages/Security/{roles,users,Automation}`.
8. **features/landing** ← `pages/landing-page` (the `land` shell) + `pages/home` (marketing).
9. **features/billing**, **features/support**, **features/widgets** (floating-widget), **shared/components/loading**.
10. Update `app.routes.ts` and `land-module.ts` import paths; delete empty `pages/`.

## Cleanup already done
- Removed dead `canvas-board/`, `click-edit-field/`, and orphaned canvas services (`canvas-service`, `canvas-history-service`, `canvas-version.service`, `ruler`, `selection`).
- New `core/` (models, render util, template/certificate services) and `features/designer/` in place.

## Notes
- `LanguageChange.Service.ts` and `language-service.ts` overlap — consolidate to one in `core/services` (LanguageChange.Service is wired in `app.config.ts`).
- `land-module.ts` (NgModule) aggregates many feature components; as features move, its import paths update. Converting it fully to standalone + lazy routes is a later step.
- Verification is via your local `ng build` after each feature move.
