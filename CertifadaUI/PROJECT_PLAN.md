# Certifada — clean architecture & build plan

A plan-gated certificate platform: design dynamic certificates, generate them (single + bulk), route them through approval, and manage branding/users/roles/automation — with every feature gated by the user's plan via one permission directive.

## 1. Folder architecture (matches the Angular reference)

```
src/app/
├─ core/                      # provided once (singletons)
│  ├─ services/               # auth, token, permission, template, certificate,
│  │                          #   credential, branding, user, role, automation, settings, ai
│  ├─ guards/                 # auth.guard, permission.guard (route-level gating)
│  ├─ interceptors/           # auth (JWT), error, language
│  ├─ models/                 # DTOs / interfaces (typed API contracts)
│  ├─ constants/              # actions registry, plan limits, route names
│  └─ tokens/                 # InjectionTokens (env, config)
├─ shared/                    # reusable, imported by features
│  ├─ components/             # buttons, dialogs, toast, table, empty-state, upgrade-plan…
│  ├─ directives/             # appHasAction (plan gating), autofocus…
│  ├─ pipes/                  # safe-html, filter, date…
│  └─ utils/                  # zip, csv/excel, render, validators
├─ layout/                    # shells
│  ├─ public-layout/          # marketing site header/footer (no auth)
│  ├─ app-layout/             # authenticated shell: sidebar + topbar + content
│  └─ canvas-layout/          # full-bleed editor shell
├─ features/                  # one lazily-loaded folder per area (standalone)
│  ├─ public/                 # home (hero, pricing, who-we-are, contact)
│  ├─ auth/                   # login (email/pass + Google/Facebook/Microsoft), callback
│  ├─ dashboard/
│  ├─ templates/              # list (edit/delete/archive/info/preview)
│  ├─ designer/               # the Fabric canvas editor
│  ├─ credentials/            # generate: single + Excel bulk + quota + workflow
│  ├─ approvals/              # approve/reject credentials per workflow
│  ├─ branding/               # branch name, copy-from, fonts/logo/palette, domain
│  ├─ users/                  # list, invite, assign role
│  ├─ roles/                  # RBAC editor (sensitive)
│  ├─ automation/             # triggers + email builder (placeholders + preview)
│  └─ settings/
├─ app.config.ts  app.routes.ts  app.ts
└─ styles.scss                # design tokens (--cf-*)
```

## 2. Route & permission map

| Route | Layout | Gate (appHasAction / permissionGuard) |
|---|---|---|
| `/` (home, pricing, who-we-are, contact) | public | none (public) |
| `/auth/login` | public/empty | none |
| `/dashboard` | app | `Dashboard_View` |
| `/templates` | app | `Template_View`; row actions: `Template_Edit`, `Template_Delete`, `Template_Archive` |
| `/canvas`, `/canvas/:id` | canvas | `Template_Edit` (create/edit); export: `Template_Export` |
| `/credentials` | app | `Credential_View`; generate: `Credential_Generate`; bulk: `Credential_Bulk` |
| `/approvals` | app | `Credential_Approve` |
| `/branding` | app | `Branding_Manage` |
| `/users` | app | `User_View` / `User_Manage` |
| `/roles` | app | `Role_Manage` |
| `/automation` | app | `Automation_Manage` |
| `/settings` | app | `Settings_Manage` |

## 3. The smart parts (the "why")

- **One gate, everywhere.** `[appHasAction]="actions.X"` disables + shows a lock tooltip + offers an upgrade dialog when the plan doesn't include action `X`. Routes use `permissionGuard` with `data.featureId`. The backend puts the allowed action codes in the JWT; the directive and guard read them from `AuthService.userActions`. Add a feature → add one action code → gate it in one line. No scattered `*ngIf`.
- **Standalone + lazy.** Every feature is a standalone component lazily loaded by route → small initial bundle, clean boundaries, no giant NgModule.
- **Signals for state.** Feature state lives in small signal-based services in `core/services`; components stay thin.
- **Typed contracts.** All API I/O goes through `core/models` interfaces and `core/services`, so the API can be swapped/changed in one place.
- **Designer = service + thin components.** `FabricCanvasService` owns the canvas; panels (tools, properties, layers) are dumb views. Dynamic fields use `{{field}}`; bulk merge replaces them. Export (PNG/PDF/SVG/JSON) and "addons" (watermark / tamper-proof output) live in `shared/utils`.
- **Bulk done safely.** Download an Excel template built from the selected template's `{{fields}}` → user uploads → **validate** (required columns, row count, types) → **check quota** (created vs plan limit) → generate → push into **workflow approval**.
- **Multi-tenant branding.** A branch's fonts/logo/palette theme its templates and drive the "your own domain" feature; "copy from" clones another branch's branding.
- **Automation.** Trigger builder + email composer (subject/body + insertable placeholders + live preview) for Templates, Credentials, and Portal events.

## 4. Build phases (frontend first, then API + SQL)

1. **Foundation** — clean folders, `core` (auth, permission, guards, interceptors, models, **actions registry**), `shared` (`appHasAction`, primitives), the 3 layout shells, the routing skeleton with all feature routes + guards.
2. **Public site + auth** — home (hero / pricing / who-we-are / contact), login (email/pass + social).
3. **Dashboard + Templates** — dashboard widgets; templates list with gated edit/delete/archive/info/preview.
4. **Designer** — the Fabric editor (page presets + mm sizing, fonts/effects, images/backgrounds, `{{fields}}`, signatures, elements/shapes/icons/badges, QR, tables, drawing, addons, AI, export).
5. **Credentials** — single + Excel bulk (template download, upload, validation, quota) + workflow approval; **Approvals** page.
6. **Branding / Users / Roles / Automation / Settings**.
7. **Backend** — .NET API + SQL matching `core/models` contracts (auth + permissions in JWT, templates, credentials, branding, RBAC, automation, quota/workflow).

## 5. "Latest version" note

The current app is Angular 20 (current major). The clean architecture above applies to it directly and it already builds with the working designer/bulk. Moving to Angular 21 is a separate `ng update` once it's the active LTS. A from-scratch new project would discard the working canvas/designer/auth — see the question I'm asking alongside this plan.
