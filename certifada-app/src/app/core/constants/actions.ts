/**
 * Central permission registry. Each value is the action CODE the backend returns
 * in the token (AuthService.userActions), derived from the user's role. The
 * `appHasAction` (disable) directive, `*appCanAction` (hide/show) directive and
 * `permissionGuard` all compare against these. Add a feature -> add one entry ->
 * gate it with [appHasAction]="actions.X", *appCanAction="actions.X", or route
 * data { action: actions.X }. Codes should be aligned with the backend.
 */
export enum Actions {
  Dashboard_View = 'DASH_VIEW',

  Template_View = 'TPL_VIEW',
  Template_Create = 'TPL_CREATE',
  Template_Edit = 'TPL_EDIT',
  Template_Delete = 'TPL_DELETE',
  Template_Archive = 'TPL_ARCHIVE',
  Template_Export = 'TPL_EXPORT',
  Template_Info = 'TPL_INFO',

  Canvas_View = 'EXNDM',
  Canvas_Save = 'CDDCR',
  Canvas_Edit = 'EDITC',
  Canvas_Delete = 'DELDR',
  Canvas_Print = 'CNV_PRINT',
  Canvas_AI = 'CNV_AI',

  Credential_View = 'CRED_VIEW',
  Credential_Generate = 'CRED_GEN',
  Credential_Bulk = 'CRED_BULK',
  Credential_Approve = 'CRED_APPROVE',
  Credential_Reject = 'CRED_REJECT',
  Credential_Revoke = 'CRED_REVOKE',
  Credential_Resend = 'CRED_RESEND',
  Credential_Edit = 'CRED_EDIT',
  Credential_Export = 'CRED_EXPORT',
  Credential_Download = 'CRED_DOWNLOAD',

  Approval_View = 'APPROVAL_VIEW',
  Analytics_View = 'ANALYTICS_VIEW',

  Branding_Manage = 'BRAND_MANAGE',

  User_View = 'USER_VIEW',
  User_Manage = 'USER_MANAGE',
  User_Invite = 'USER_INVITE',
  User_Remove = 'USER_REMOVE',
  Role_View = 'ROLE_VIEW',
  Role_Manage = 'ROLE_MANAGE',

  Automation_View = 'AUTO_VIEW',
  Automation_Manage = 'AUTO_MANAGE',

  Billing_View = 'BILLING_VIEW',
  Billing_Manage = 'BILLING_MANAGE',
  Plan_Change = 'PLAN_CHANGE',
  Pricing_View = 'PRICING_VIEW',

  Profile_Manage = 'PROFILE_MANAGE',
  Signature_Manage = 'SIGNATURE_MANAGE',
  Settings_Manage = 'SET_MANAGE',
  Support_View = 'SUPPORT_VIEW',
}

/** Alias for ergonomic template use: [appHasAction]="actions.Template_Edit". */
export const actions = Actions;
