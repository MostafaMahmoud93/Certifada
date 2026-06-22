/**
 * Central permission registry. Each value is the action CODE the backend
 * returns inside the JWT (AuthService.userActions). `appHasAction` and
 * `permissionGuard` compare against these. Add a feature -> add one entry ->
 * gate it with [appHasAction]="actions.X". (Readable codes are placeholders to
 * be aligned with the backend; the four canvas codes are the existing ones.)
 */
export enum Actions {
  // Dashboard
  Dashboard_View = 'DASH_VIEW',

  // Templates
  Template_View = 'TPL_VIEW',
  Template_Create = 'TPL_CREATE',
  Template_Edit = 'TPL_EDIT',
  Template_Delete = 'TPL_DELETE',
  Template_Archive = 'TPL_ARCHIVE',
  Template_Export = 'TPL_EXPORT',
  Template_Info = 'TPL_INFO',

  // Canvas / Designer (existing backend codes preserved)
  Canvas_View = 'EXNDM',
  Canvas_Save = 'CDDCR',
  Canvas_Edit = 'EDITC',
  Canvas_Delete = 'DELDR',
  Canvas_Print = 'CNV_PRINT',
  Canvas_AI = 'CNV_AI',

  // Credentials
  Credential_View = 'CRED_VIEW',
  Credential_Generate = 'CRED_GEN',
  Credential_Bulk = 'CRED_BULK',
  Credential_Approve = 'CRED_APPROVE',

  // Branding
  Branding_Manage = 'BRAND_MANAGE',

  // Users & Roles
  User_View = 'USER_VIEW',
  User_Manage = 'USER_MANAGE',
  Role_View = 'ROLE_VIEW',
  Role_Manage = 'ROLE_MANAGE',

  // Automation
  Automation_View = 'AUTO_VIEW',
  Automation_Manage = 'AUTO_MANAGE',

  // Settings
  Settings_Manage = 'SET_MANAGE',
}
