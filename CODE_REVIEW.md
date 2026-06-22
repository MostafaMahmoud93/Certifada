# Certifada — Code Review & Health Check

**Date:** 13 June 2026
**Scope:** Full stack — `.NET 10` backend (API / Application / Domain / Infrastructure / Resources) and the `Angular 20` frontend (`CertifadaUI`).
**Method:** Static review of ~130 C# files and ~124 TypeScript files plus configuration. The backend could not be compiled in this environment (no .NET 10 SDK available); findings are from source analysis. The frontend was reviewed against its build config.

---

## 1. Executive summary

The solution is built on a sound foundation: the backend follows a recognizable Clean Architecture layering with a generic repository / unit-of-work pattern, AutoMapper, a consistent `ServiceResponse<T>` envelope, and localization; the frontend uses a modern Angular 20 setup (zoneless, standalone root, functional interceptors and guards, Transloco i18n). **The architecture is not the problem.** The problems are concentrated in three areas: **security hygiene, half-finished integrations, and code-health debt** from rapid prototyping.

The single most urgent issue is that **live production credentials are committed to source control** — the JWT signing key, three OAuth client secrets, Stripe keys, and a plaintext SQL password. This should be treated as a credential-rotation incident regardless of anything else in this report.

The three headline risk themes:

1. **Secrets & auth exposure** — committed secrets, a seeded admin with a documented weak password, JWTs stored in browser `localStorage`, unauthenticated billing/webhook/brand endpoints, and an entire per-action permission layer that is commented out.
2. **Broken or fake flows** — the frontend login form never actually authenticates (and logs the password to the console), the 401 interceptor redirects to routes that don't exist and never clears the session, the Stripe webhook handler is a no-op, and a `DbSet` is mapped to the wrong entity.
3. **Code-health debt** — `throw ex;` repeated 43 times (destroying stack traces), pagination that filters after paging, 100+ `any` types, ~39 unmanaged RxJS subscriptions, 2000-line "God" components, duplicate services/interfaces, and leftover scaffolding.

The good news: strict TypeScript and strict templates are already on, the layering is clean, and most of the debt is mechanical to clear.

---

## 2. Severity definitions

| Severity | Meaning |
|---|---|
| **Critical** | Exploitable security hole or data-loss risk. Fix before any deployment. |
| **High** | Broken functionality, security weakness, or reliability bug affecting normal use. |
| **Medium** | Correctness, performance, or maintainability problem that will bite under load or over time. |
| **Low** | Cleanup, consistency, polish. |

---

## 3. CRITICAL — security (action required)

> **These require human action beyond a code edit (credential rotation, infra/config decisions). They are listed first because they are the highest priority.**

| # | Issue | Location | Required action |
|---|---|---|---|
| C1 | **Live secrets committed**: JWT signing key, Google/Facebook/Microsoft OAuth client secrets, Stripe publishable + secret keys all hardcoded in tracked config. A public JWT key means anyone can forge valid tokens for any user. | `Certifada.API/appsettings.json` (JWT key, OAuth, Stripe sections) | **Rotate every one of these credentials now.** Move them to User Secrets / environment variables / a vault. Remove from the file **and from git history** (`git filter-repo` or BFG). |
| C2 | **Plaintext Azure SQL password** committed in a comment (`password=5b.UCLh8pbLB*EB`). | `Certifada.API/appsettings.json` (commented connection string) | Rotate the SQL password; never store DB credentials in committed config. Use a secret store or managed identity. |
| C3 | **Seeded admin with documented weak password** — default active admin (`must345@yahoo.com`) seeded with a hash whose plaintext (`P@55w0rd`) is in the code comment. Every deployment ships this known account. | `Certifada.Infrastructure/Configuration/SeedInitialData/SeedInitialData.cs:14-26`; duplicated in `Migrations/20260111114510_intData.cs:101` | Remove the seeded password/comment; force a password reset on first login or provision the admin per-environment out of band. |
| C4 | **SSRF via unauthenticated endpoint** — `POST /api/brand/extract` has no `[Authorize]`, takes an arbitrary URL, and does server-side fetches on it (follows manifest/CSS links). Lets an attacker probe internal services / cloud metadata. | `Certifada.API/Controllers/BrandController.cs` | Require auth, allowlist target hosts, block private/loopback/link-local IP ranges, disable redirects. |
| C5 | **JWT stored in `localStorage`** (token + userId + isAdmin + userActions) — readable by any injected script (XSS → account takeover). | `CertifadaUI/src/app/pages/Security/Auth.service.ts:26-36,52` | Move to httpOnly/Secure/SameSite cookies issued by the backend (the interceptor already sends `withCredentials`), or at minimum an in-memory store. Stop persisting JWTs in web storage. |
| C6 | **Production build ships pointing at `localhost`** — services import `environments/environment.development` directly, so `angular.json`'s `fileReplacements` never applies. Both env files are identical (`apiURL: https://localhost:7227`). | `CertifadaUI/src/environments/*`, imports in `Auth.service.ts`, `billing/pricing.billing.service.ts`, `landing-page/brand-extractor.service.ts` | Import only from `environments/environment`; put real prod values in `environment.ts`. (**Fixed in this pass — see §8.**) |

---

## 4. Backend findings (.NET)

### High

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| B1 | Bug / Security | `Certifada.Application/Implementation/Common/AuthService.cs:41-42` | Password is verified *before* the `user != null` check → NullReferenceException for unknown emails; also enables user-enumeration timing and crashes social-only users (null hash). | Null-check first; return the same generic failure for "not found" and "bad password". (**Fixed — §8**) |
| B2 | Security | `Certifada.API/Program.cs:67-72` | `DevPolicy` CORS = `AllowAnyOrigin + AllowAnyHeader + AllowAnyMethod`. Dangerous if ever used outside Development. | Restrict to the known SPA origin; never combine `AllowAnyOrigin` with credentials. |
| B3 | Security | `Certifada.API/Extensions/ConfigureAuthuntication.cs:44` | `RequireHttpsMetadata = false` allows token/metadata over plaintext. | Set `true` in production (gate on environment). (**Fixed — §8**) |
| B4 | Security | `Certifada.API/Controllers/BillingController.cs`, `WebhooksController.cs` | Both inherit `ControllerBase` (not the `[Authorize]` `ApiControllersBase`), so checkout/portal/session endpoints are anonymous; `CreateCheckoutSession` falls back to `userId = "anon"`. | Add `[Authorize]` / inherit `ApiControllersBase`; derive user id from the authenticated principal. |
| B5 | Bug | `Certifada.API/Controllers/WebhooksController.cs:48-61` | Stripe webhook signature is verified but all event handling is `// TODO` — subscription state is never persisted. | Implement the DB upserts for `checkout.session.completed` and subscription events before go-live. |
| B6 | Performance / Bug | `Certifada.Infrastructure/DBContext/Certifada_DbContext.cs:70-97` | `SaveChangesAsync` runs `Users.FirstOrDefaultAsync(x => x.Is_Active)` on **every** save (extra round-trip) and NREs if no active user exists. | Resolve the fallback user only when `GetCurrentUserId()` is null; guard for null. |
| B7 | Bug | `Certifada.Infrastructure/DBContext/Certifada_DbContext.cs:49`; `UnitOfWork.cs:35-36` | `DbSet<Feature> TenantPlans` (and `TenantPlanRepository`) map the **wrong entity** — should be `TenantPlan`. `TenantPlan` data is unreachable via this accessor. (`TenantPlan` entity confirmed to exist.) | Change the DbSet and repository to `TenantPlan`. (**Fixed — §8**) |

### Medium

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| B8 | Bug | `Repositories/BaseRepository.cs:235`; `CustomBaseRepository.cs:144` | `GetAllPaginationAsync` does `.Skip().Take().Where()` — pages **before** filtering, returning wrong/partial pages. | Reorder to `.Where().Skip().Take()`. (**Fixed — §8**) |
| B9 | Code quality | `BaseRepository.cs` (25×), `CustomBaseRepository.cs` (18×) — **43 total** | `catch (Exception ex) { throw ex; }` resets the stack trace and adds nothing. | Use bare `throw;` (or remove the try/catch). (**Fixed — §8**) |
| B10 | Performance | `BaseRepository.cs:479,510,515,586`; `CustomBaseRepository.cs:17` | Synchronous `query.Count()` inside async methods (sync-over-async); counted twice in one method. | Use `await query.CountAsync()`, once. |
| B11 | Performance / Arch | `BaseRepository.cs:94-105` (`GetAllQ` returns `IQueryable<T>`), used by `AuthService.cs:34,85` | Repository leaks `IQueryable` to the service layer; most reads return tracked entities unnecessarily. | Return materialized results / specs; use `AsNoTracking()` for reads. |
| B12 | Bug | `Repositories/UnitOfWork.cs:62` | `Database.OpenConnection()` with no matching close / `using` — risks holding the connection open. (SQL is correctly parameterized — no injection.) | Wrap in try/finally + `CloseConnection()`, or let EF manage it. |
| B13 | Bug | `CustomBaseRepository.cs:103-117` (line 111) | `GetAllOrderingAscAsync` calls `OrderByDescending` in its filtered branch — "Asc" silently sorts descending. | Change to `OrderBy`. (**Fixed — §8**) |
| B14 | Bug | `AuthService.cs:182` | Token `expires: DateTime.Now…` with `ClockSkew = Zero` → lifetimes shift by server UTC offset (premature/late expiry). | Use `DateTime.UtcNow`. (**Fixed — §8**) |
| B15 | Security | `Application/Bases/ServiceBase.cs:45,65`; `UnitOfWork.cs:197`; `Program.cs` | Error logger serializes the full input object to flat `.log` files — for login that includes the **plaintext password**; for SQL, raw queries + params. | Redact secrets; use a structured logger (Serilog/`ILogger`) with proper sinks/retention. |
| B16 | Security / Arch | `Certifada.API/Bases/ApiControllersBase.cs:4-5`; `ConfigureServiceType.cs:16-17` | The per-action permission filter (`ActionFilter`) and audit filter (`HistoryFileFilter`) are commented out and unregistered. Despite an elaborate roles/permissions seed, **any authenticated user can call any non-anonymous endpoint** (e.g. `DeleteUser`). | Re-enable a permission filter or apply `[Authorize(Policy=…)]`/role checks per endpoint; if abandoned, delete the filters. |
| B17 | Bug / Security | `AuthService.cs:160-161`; `Filters/ActionFilter.cs:35` | `IfUserHasActions` returns `!userActions.Any(... baseRoute.Contains(...))`; semantics look inverted and substring route matching is collision-prone; empty action list → "has permission". | Make semantics explicit (`HasAccess`), use exact route matching, add tests. |

### Low

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| B18 | Config | `Certifada.Domain.csproj:10`, `Certifada.Infrastructure.csproj:10` | Legacy `Microsoft.AspNetCore.Http 2.3.0` referenced in net10 libraries (just for `IFormFile`); Domain shouldn't depend on ASP.NET HTTP types. | Remove the package; use `FrameworkReference Microsoft.AspNetCore.App` if needed; keep web types out of Domain. |
| B19 | Config | All csproj | TFM is `net10.0` but EF Core / ASP.NET / Identity packages pinned to `9.0.8`; versions scattered. | Align to net10 (`10.x`) packages; adopt `Directory.Packages.props` for central versioning. |
| B20 | Bug | `ConfigureAuthuntication.cs:31` | `Response.Headers.Add("IS-TOKEN-EXPIRED", …)` throws if the header already exists. | Use the indexer assignment. (**Fixed — §8**) |
| B21 | Code quality | `UserModel.cs`, `User.cs` | Non-nullable `string` properties never initialized under NRT → warning noise, masks real null issues. | Mark optional ones nullable or use `required` / `= string.Empty`. |
| B22 | Code quality | `BaseRepository.cs:745-798` (dead variants); misspellings `InsializeQuery`, `ConfigureAuthuntication`, `CreateTanent`, `rejester`; Arabic dev comments; duplicated `CreateTanent`/`GenerateTenantName` in `AuthService` **and** `UserService` | Dead/commented code, typos in public type names, copy-paste duplication. | Delete dead code, fix spellings, extract the shared tenant helper. |
| B23 | Organization | `Certifada.API/2025/**`, `Certifada.API/2026/**` | Runtime error-log directories committed in the project root. | Redirect logging outside the content root; delete these folders. (**Removed — §8**) |

---

## 5. Frontend findings (Angular)

### High

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| F1 | Bug / Security | `pages/Security/login/login.ts:84-92` | `onSubmit()` **never calls** `AuthService.login()` — it logs the full form (incl. password) to the console and just navigates to `/land`. Email/password login is non-functional. | Wire to `_authService.login(...)`, handle token, remove the `console.log`. |
| F2 | Bug / Security | `core/interceptors/auth.interceptor.ts:27-35` | On 401 it navigates to `'admin/401-un-auth'` and `'login'` — **neither route exists** (real: `'401-un-auth'`, `'auth/login'`); `signOut()` is commented out, so the session is never cleared. | Use `'/401-un-auth'` and `'/auth/login'`; call `signOut()` before redirect. (**Fixed — §8**) |
| F3 | Security / Arch | `app.routes.ts:8-111` | Only `401-un-auth` is guarded. The dashboard tree (`land`), `canvas`, `billing`, `support` have **no `authGuard`**. `permissionGuard` is fully implemented but wired to nothing. | Apply `authGuard` to authenticated routes and `permissionGuard` (with `data.featureId`) where needed. |
| F4 | Bug / Perf | 39 occurrences / 13 files (e.g. `canvas-board/detail-panel`, `canvas`, `login.ts:46`) | Manual `.subscribe()` with no `takeUntilDestroyed` / `async` pipe → subscription leaks in long-lived components. | Prefer `async` pipe; otherwise `takeUntilDestroyed(this.destroyRef)` on every subscription. |
| F5 | Arch / Perf | `canvas/canvas.ts` (2000 lines), `detail-panel.ts` (1362), `canvas-board.ts` (826) | "God" components mixing Fabric.js manipulation, business logic, persistence, and view state — unmaintainable, untestable. | Extract logic into services; split into smaller child components with `@Input`/`@Output`. |
| F6 | Arch / Bug | `canvas-board.ts:96,115`; `reports/report-table.component.ts:156,177`; `branding.component.ts`; `workflow-steps.component.ts`; mock services `Automation/automation.service.ts`, `roles/roles.ts:15-62` | Core domain data (templates, workflows, roles, automations, branding) stored in `localStorage` or hardcoded arrays instead of via the API → per-browser, unsynced, lost on clear. No real state layer. | Back these with HttpClient services + a signals/store state layer; reserve `localStorage` for UI prefs. |

### Medium

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| F7 | Performance | app-wide (0 `OnPush`); `app.config.ts:14` runs **zoneless** | No `OnPush`/signals under zoneless CD risks stale views; heavy getter bindings recompute every cycle. | Adopt `OnPush` + signals; replace template getters with memoized values/signals. |
| F8 | Performance | 84 `*ngFor` / 28 files; only 1 `track` app-wide | No `trackBy`/`track` → full DOM re-render on every change. | Add `trackBy` or migrate to `@for (… ; track item.id)`. |
| F9 | Architecture | 18 `standalone: false` components in `land-module.ts` / `canvas-module.ts`; rest standalone | App straddles standalone + NgModule paradigms inconsistently. | Standardize on standalone + lazy `loadComponent`/`loadChildren`; retire the feature NgModules. |
| F10 | Code quality | `canvas-module.ts:18` (`HttpClientModule`), `:57,59` (`MatDialogModule` twice), `:71` (`{ provide: 'AiHelperService', useClass: … }`) | Deprecated `HttpClientModule`; duplicate import; magic-string injection token. | Remove `HttpClientModule` + duplicate; inject `AiHelperService` by class. |
| F11 | Typing | 100+ `any` / 32 files (`canvas.ts`, `branding.component.ts`, `report-table.component.ts`, `roles.ts`, `login.ts:63`) | Heavy `any` defeats strict mode and the typed `ServiceResponse<T>` models. | Replace with concrete interfaces; use `unknown` + narrowing for dynamic shapes. The `models/` folder is nearly empty — build it out. |
| F12 | Organization | `shared/language-service.ts` **and** `shared/LanguageChange.Service.ts` | Two overlapping `providedIn:'root'` language services; the second is mostly commented-out dead code. `app.config.ts:41-47` also registers `provideAppInitializer` incorrectly as a `{provide,useValue}` object. | Consolidate to one service; delete the dead one; fix the malformed initializer. |
| F13 | Typing | `models/ServiceResponse.ts:4` | Uses boxed `Boolean` instead of primitive `boolean`. | Use `boolean`. (**Fixed — §8**) |

### Low

| # | Category | Location | Problem | Fix |
|---|---|---|---|---|
| F14 | Code quality | 30 `console.*` / 18 files (`app.ts:28`, `auth.interceptor.ts:31`, `login.ts:47,87`, …) | Debug logs left in production code (some leak data). | Remove or route through a log service stripped in prod. |
| F15 | Organization | `pages/oldhome/` (unreferenced); commented route blocks `app.routes.ts:10-11,23-34,68-71`; ~14 boilerplate `*.spec.ts` under `pages/home/components/**` | Dead scaffolding and commented-out blocks. | Delete `oldhome/` (**done — §8**); remove commented routes; implement or remove placeholder specs. |
| F16 | Code quality | `detail-panel.ts:18-30` | `VariableEntry` and `FVariableEntry` are byte-for-byte identical. | Collapse into one interface. |
| F17 | Organization | `home` / `land` / `templates` lowercase class names; `LanguageChange.Service.ts` casing; `Security/`, `Automation/`, `Loading/` PascalCase folders vs kebab elsewhere; UI typos `'Desginer'`, `'Certifcates'`, `'Cerdintials'` (`roles.ts:17-26`) | Naming/convention inconsistencies, user-facing typos. | PascalCase class names with `Component`/`Service` suffixes; kebab-case files/folders; fix typos. |
| F18 | Code quality | `auth.interceptor.ts:11` (`localStorage.getItem('lang') || localStorage.setItem(...) || 'ar'`); `roles.ts:95,111,156,166` | Side-effecting one-liners relying on `setItem` returning `undefined`; multiple statements per line. | Split into readable statements. (**interceptor fixed — §8**) |
| F19 | Config | `transloco.config.ts:23` | `prodMode: true` hardcoded for all builds. | Drive from `environment.production`. |
| F20 | Accessibility | `roles.html`, `templates.html:28`, canvas toolbars | Clickable `<i>` icons aren't keyboard-focusable or screen-reader-labeled. | Use `<button>` with `aria-label` for icon actions; associate `<label for>` with inputs. |

---

## 6. Organization & structure

Items that are misfiled or dead, and the recommended placement:

- `Certifada.API/2025/`, `Certifada.API/2026/` — committed runtime logs in the project root. **Remove; log outside the content root.**
- `Certifada.API/Controllers/Auth/StripeOptions.cs` — a Stripe options POCO filed under the Auth *controllers* folder; its namespace is already `Certifada.API.Options`. **Move to `Certifada.API/Options/`.**
- `Certifada.API/Services/` (`BillingService`, `IBillingService`, `BillingDtos`) — business/service logic living in the API project, inconsistent with the rest of the architecture. **Move to the Application layer.**
- `Certifada.API/Controllers/BrandController.cs`, `DomainController.cs` — stub/mock controllers (hardcoded "demo/test taken", the SSRF fetcher), no namespace, don't inherit `ApiControllersBase`. **Finish or remove.**
- `Certifada.API/Filters/ActionFilter.cs`, `HistoryFileFilter.cs` — referenced only from commented-out attributes. **Wire up or delete.**
- `BaseRepository.cs` vs `CustomBaseRepository.cs` — heavily overlapping; **consolidate.**
- Duplicated `CreateTanent`/`GenerateTenantName` in `AuthService` and `UserService` — **extract to one shared service.**
- Stale `net9.0` `bin`/`obj` output (projects now target net10). **Delete; rebuild.**
- `CertifadaUI/src/app/pages/oldhome/` — dead, unreferenced. **Delete.**
- `CertifadaUI/src/app/shared/LanguageChange.Service.ts` + `language-service.ts` — **consolidate to one.**
- `CertifadaUI/src/app/pages/home/components/**/*.spec.ts` — boilerplate default specs. **Implement or remove.**
- Folder-casing inconsistency: `pages/Security/`, `Security/Automation/`, `Loading/` (PascalCase) vs kebab elsewhere. **Normalize to kebab-case.**

---

## 7. Recommended remediation roadmap

**Phase 0 — Security incident (do immediately, mostly outside code):**
Rotate all leaked secrets (C1–C3) and scrub git history; remove the seeded weak admin; lock down the Brand/Billing/Webhook controllers (C4, B4); stop logging plaintext passwords (B15).

**Phase 1 — Make auth real & safe:**
Move JWT off `localStorage` (C5); fix the production environment wiring (C6 — done); apply route guards (F3); wire the login form to the real auth call (F1); fix the 401 interceptor (F2 — done); re-enable per-action permissions (B16/B17).

**Phase 2 — Correctness bugs:**
DbContext entity mapping (B7 — done) and `SaveChanges` query/NRE (B6); pagination order (B8 — done); ascending-sort bug (B13 — done); login null-check order (B14/B1 — done); implement the Stripe webhook (B5).

**Phase 3 — Code health:**
Replace `throw ex;` (B9 — done); async `CountAsync` (B10); kill `any` and build out `models/` (F11); manage subscriptions (F4); add `OnPush`/`trackBy` (F7/F8); align package versions (B19).

**Phase 4 — Structure & refactor:**
Decompose the canvas God-components (F5); replace `localStorage`/mock "state" with API-backed services (F6); standardize on standalone (F9); reorganization moves in §6.

---

## 8. Fixes applied in this pass

These low-risk, high-value fixes were applied directly and verified by static checks. The backend could not be compiled here (no .NET 10 SDK in this environment), so please rebuild in Visual Studio to confirm; every change is local and mechanical.

**Backend (.NET):**

- **B7** — `Certifada_DbContext.TenantPlans` DbSet, `IUnitOfWork.TenantPlanRepository`, and `UnitOfWork.TenantPlanRepository` retyped from `Feature` → `TenantPlan` (the entity exists with a `Guid` key; no other consumers, so safe).
- **B6** — `SaveChangesAsync` no longer queries for an active user on every save and no longer NREs when none exists; it resolves the current user once and falls back only when unauthenticated.
- **B1** — Login (`AuthService.Token`) now null-checks the user (and empty password hash) *before* verifying the password, eliminating the NRE / user-enumeration path.
- **B14** — JWT `expires` switched from `DateTime.Now` → `DateTime.UtcNow`.
- **B8** — `GetAllPaginationAsync` reordered to `.Where().Skip().Take()` in both `BaseRepository` and `CustomBaseRepository`.
- **B13** — `GetAllOrderingAscAsync` filtered branch fixed from `OrderByDescending` → `OrderBy`.
- **B9** — All **43** `throw ex;` replaced with `throw;` (preserves stack traces) across `BaseRepository` and `CustomBaseRepository`.
- **B3** — `RequireHttpsMetadata` now gated on environment (true outside Development).
- **B20** — `Response.Headers.Add(...)` replaced with the indexer assignment (no throw on duplicate).

**Frontend (Angular):**

- **F2** — 401 interceptor now redirects to the real routes (`/401-un-auth`, `/auth/login`) and calls `signOut()` to clear the session.
- **F1** — Login form `onSubmit()` now calls the real `AuthService.login()`, sets the token on success, and shows an error otherwise; the password `console.log` was removed.
- **C6** — The three services importing `environments/environment.development` now import `environments/environment`, so the production build no longer ships pointing at localhost. Added a `production` flag to both env files (set the real prod `apiURL` where marked).
- **F13** — `ServiceResponse.success` changed from boxed `Boolean` → `boolean`; tidied punctuation.
- **F14** (partial) — Removed the credential/token-leaking `console.log`s in the login flow and the 401 interceptor; messy `lang` one-liner in the interceptor rewritten.

**Reorganization:**

- Moved `Certifada.API/Controllers/Auth/StripeOptions.cs` → `Certifada.API/Options/StripeOptions.cs` (namespace was already `Certifada.API.Options`).
- Stale `net9.0` `bin`/`obj` output is OS-locked and could not be removed here; clean it via `dotnet clean` or by deleting `bin`/`obj` in Visual Studio.

**Verification performed:** static re-scan confirming 0 remaining `throw ex;`, consistent `TenantPlan` typing across the three sites, no remaining `environment.development` imports, no remaining credential `console.log`, and that the auth/login/interceptor edits are syntactically intact.

---

## 9. Important: no version control

This project is **not a git repository** (no `.git`). For a codebase that contains billing logic and (currently) committed secrets, that's a significant risk on its own — there's no history, no way to review or revert changes, and no safety net for the cleanup work above. **Recommended first step:** run `git init`, add a proper `.gitignore` (a .NET + Angular one is partly present), make an initial commit, and *then* rotate secrets and scrub them. Because there is no undo today, I did **not** delete any source or data files.

**Deleted (with your approval):**

- `CertifadaUI/src/app/pages/oldhome/` — dead, unreferenced component (removed; no references remained).
- `Certifada.API/2025/` and `Certifada.API/2026/` — committed runtime log folders (removed; redirect logging outside the content root going forward).

**Left for a future pass (larger refactors, best done with a compiler and tests in the loop):**

- Consolidating the duplicate language services and `BaseRepository` / `CustomBaseRepository`; decomposing the canvas God-components; moving `BillingService` into the Application layer; re-enabling per-action permissions; implementing the Stripe webhook handlers.
