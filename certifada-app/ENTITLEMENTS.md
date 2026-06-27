# Certifada — Access Control & Entitlements Map

Two independent gating dimensions, both designed to be driven by the backend:

| Dimension | Source of truth | Frontend service | Gate in templates |
|-----------|-----------------|------------------|-------------------|
| **Role / permission** | `token.userActions` (string codes in the JWT) | `PermissionService` | `[appHasAction]` (disable), `*appCanAction` (hide), `permissionGuard` (route) |
| **Plan / subscription** | current plan id (`PlanService.plan()`) + `PLAN_FEATURES` matrix | `PlanService` | `[appPlanFeature]` (crown + upgrade dialog), `selectPanel` gating in canvas |

Both **fail open** when the backend has not supplied data yet (empty `userActions` ⇒ no role gating; unknown feature ⇒ allowed) so the UI is never accidentally locked out. The backend remains the real enforcement layer on every request.

---

## 1. Role actions (RBAC) — `core/constants/actions.ts`

The backend returns the allowed action **codes** for the user's role in `token.userActions`.
Each enum value is one code. Gate UI with the action; gate routes with `data: { action }`.

Dashboard_View · Template_View/Create/Edit/Delete/Archive/Export/Info ·
Canvas_View/Save/Edit/Delete/Print/AI · Credential_View/Generate/Bulk/Approve/Reject/Revoke/Resend/Edit/Export/Download ·
Approval_View · Analytics_View · Branding_Manage · User_View/Manage/Invite/Remove · Role_View/Manage ·
Automation_View/Manage · Billing_View/Manage · Plan_Change · Pricing_View · Profile_Manage · Signature_Manage · Settings_Manage · Support_View

## 2. Plan features (entitlements) — `core/services/plan.service.ts → PLAN_FEATURES`

Minimum plan that unlocks each feature (plan order: Free < Basic < Professional < Enterprise):

| Feature key | Min plan | Where it gates |
|-------------|----------|----------------|
| `branding`     | Basic        | Branding page, custom logo/colors |
| `qr`           | Professional | Canvas → QR rail tab |
| `table`        | Professional | Canvas → Table rail tab |
| `ai`           | Professional | Canvas → AI rail tab |
| `drawing`      | Professional | Canvas → Drawing rail tab |
| `imageStudio`  | Professional | Canvas → advanced image studio |
| `bgStudio`     | Professional | Canvas → advanced background studio |
| `bulk`         | Professional | Issue → Bulk tab |
| `analytics`    | Professional | Issued insights / dashboard analytics |
| `multiPage`    | Professional | Multi-page designs |
| `apiAccess`    | Enterprise   | API keys |
| `whiteLabel`   | Enterprise   | White-label / remove branding |
| `sso`          | Enterprise   | SSO / SAML |

`PlanService.can(feature)`, `.requiredPlan(feature)`, `.featureLabel(feature)` drive the gates.

## 3. Backend mapping checklist (when the API is ready)

1. **Auth/login** → return `userActions: string[]` (role's action codes) in the token. `PermissionService` already reads `token.userActions`.
2. **Plan** → return the user's plan id; `PlanService` reads it (`cf-plan` / `cf-settings.plan` today). Swap that read for the API value. `PLAN_FEATURES` then derives unlocked features — OR have the API return an explicit `features: string[]` and adapt `PlanService.can()` to check it.
3. **Server-side enforcement** → mirror both checks on every endpoint (role action + plan feature). The UI gates are UX only.

## 4. How to apply a gate

```html
<!-- role: dim + block + lock tooltip -->
<button [appHasAction]="actions.Credential_Bulk">Bulk issue</button>
<!-- role: hide entirely if not allowed -->
<button *appCanAction="actions.User_Invite">Invite</button>
<!-- plan: gold crown + opens Upgrade dialog on click -->
<button [appPlanFeature]="'bulk'">Bulk issue</button>
```

The upgrade dialog (`UpgradeService` + `<app-upgrade-dialog/>`, hosted in the app & canvas layouts) names the required plan and links to `/pricing`.
